import { ref, computed } from 'vue'
import type { ComputedRef } from 'vue'
import { createEmptyCard, fsrs, Rating } from 'ts-fsrs'
import { useDexie, type CountryCard } from './useDexie'

export interface GeographyLearning {
  targetCountryToClick: ComputedRef<string | null>
  targetCountryIsHighlighted: ComputedRef<boolean>
  message: ComputedRef<string>
  setAvailableCountries: (countries: string[]) => void
  selectRandomCountry: () => Promise<void>
  handleCountryClick: (country: string) => Promise<void>
  handleGameCompletion: (country: string, attempts: number) => Promise<void>
}

export function useGeographyLearning(): GeographyLearning {
  const { getCard, saveCard, getDueCards, getAllCards } = useDexie()
  const targetCountryToClick = ref<string | null>(null)
  const message = ref<string>('')
  const targetCountryIsHighlighted = ref(false)
  const isFirstTry = ref(true)
  const availableCountries = ref<string[]>([])
  const lastPlayedCountry = ref<string | null>(null)

  const setAvailableCountries = (countries: string[]) => {
    availableCountries.value = countries
  }

  const selectRandomCountry = async () => {
    // Reset state for new country
    targetCountryIsHighlighted.value = false
    isFirstTry.value = true
    
    // First check for due cards
    const dueCards = await getDueCards()
    
    // Filter out the last played country from due cards
    const availableDueCards = dueCards.filter(card => card.countryName !== lastPlayedCountry.value)
    
    if (availableDueCards.length > 0) {
      // Select from available due cards
      const randomDueCard = availableDueCards[Math.floor(Math.random() * availableDueCards.length)]
      targetCountryToClick.value = randomDueCard.countryName
      lastPlayedCountry.value = randomDueCard.countryName
      return
    }

    // If no available due cards, get all cards to find unseen countries
    const allCards = await getAllCards()
    const seenCountries = new Set(allCards.map(card => card.countryName))
    const unseenCountries = availableCountries.value.filter(country => 
      !seenCountries.has(country) && country !== lastPlayedCountry.value
    )
    
    if (unseenCountries.length > 0) {
      // Select from unseen countries
      const randomIndex = Math.floor(Math.random() * unseenCountries.length)
      const selectedCountry = unseenCountries[randomIndex]
      
      // Create and save empty card for the new country
      const emptyCard = createEmptyCard()
      const newCard = {
        ...emptyCard,
        countryName: selectedCountry,
        winStreak: 0,
        failStreak: 0,
        level: 0
      } as CountryCard
      await saveCard(newCard)
      
      targetCountryToClick.value = selectedCountry
      lastPlayedCountry.value = selectedCountry
      message.value = `Click ${targetCountryToClick.value}`
      return
    }

    // If all countries have been seen, pick a random one that's not the last played
    const availableForRandom = availableCountries.value.filter(country => 
      country !== lastPlayedCountry.value
    )
    
    const randomIndex = Math.floor(Math.random() * availableForRandom.length)
    targetCountryToClick.value = availableForRandom[randomIndex]
    lastPlayedCountry.value = targetCountryToClick.value
    message.value = `Click ${targetCountryToClick.value}`
  }

  const updateCardStreaks = (card: CountryCard, isCorrect: boolean, isFirstTry: boolean): void => {
    if (!card.winStreak) card.winStreak = 0
    if (!card.failStreak) card.failStreak = 0
    if (!card.level) card.level = 0

    if (isCorrect) {
      if (isFirstTry) {
        card.winStreak += 1
        card.failStreak = 0
        
        // Level up logic with three tiers of difficulty
        const requiredWinStreak = 
          card.level <= 2 ? 1 :  // Levels 0-2: need 1 win
          card.level <= 5 ? 2 :  // Levels 3-5: need 2 wins
          3                      // Levels 6+: need 3 wins
        
        if (card.winStreak === requiredWinStreak) {
          card.level += 1
          card.winStreak = 0
        }
      } else {
        card.winStreak = 0
        card.failStreak += 1
      }
    } else {
      card.winStreak = 0
      card.failStreak += 1
      
      // Level down when failStreak hits 3
      if (card.failStreak === 3) {
        card.level -= 1
        card.failStreak = 0
      }
    }
  }

  const handleGameCompletion = async (country: string, attempts: number) => {
    let rating: Rating
    switch (attempts) {
      case 1:
        rating = Rating.Good
        break
      case 2:
        rating = Rating.Hard
        break
      default:
        rating = Rating.Again
    }

    let card = await getCard(country)
    if (!card) {
      console.error('Card not found for country:', country)
      return
    }

    // Track if this will be a level up before we modify the card
    const oldWinStreak = card.winStreak || 0
    const oldLevel = card.level || 0
    const requiredWinStreak = 
      oldLevel <= 2 ? 1 :  // Levels 0-2: need 1 win
      oldLevel <= 5 ? 2 :  // Levels 3-5: need 2 wins
      3                    // Levels 6+: need 3 wins
    const willLevelUp = attempts === 1 && oldWinStreak + 1 === requiredWinStreak

    // First update our streaks and level
    if (attempts === 1) {
      card.winStreak = oldWinStreak + 1
      card.failStreak = 0
      
      if (willLevelUp) {
        card.level = oldLevel + 1
        card.winStreak = 0
      }
    } else {
      card.winStreak = 0
      card.failStreak = (card.failStreak || 0) + 1
      
      // Level down when failStreak hits 3
      if (card.failStreak === 3) {
        card.level = (card.level || 0) - 1
        card.failStreak = 0
      }
    }

    // Then apply FSRS with our modified card
    const f = fsrs()
    const result = f.next(card, new Date(), rating)

    // Save with our modifications taking precedence for everything EXCEPT due date
    const finalCard = {
      ...result.card,           // FSRS base updates including due date
      countryName: country,     // Our overrides
      winStreak: card.winStreak,
      failStreak: card.failStreak,
      level: card.level,
      // Only override due date for level ups
      ...(willLevelUp && { due: new Date(new Date().getTime() + 10 * 1000) })
    }
    await saveCard(finalCard)

    // Dispatch progress update event
    window.dispatchEvent(new Event('learning-progress-update'))

    // Select next country after a delay
    setTimeout(selectRandomCountry, 2000)
  }

  const handleCountryClick = async (clickedCountry: string) => {
    if (!targetCountryToClick.value) return

    if (clickedCountry === targetCountryToClick.value) {
      // Correct click
      let rating: Rating
      if (isFirstTry.value) {
        rating = Rating.Good
        message.value = `Correct! That's ${clickedCountry}!`
      } else {
        rating = Rating.Hard
        message.value = `Good job finding ${clickedCountry} on the second try!`
      }

      // Get card (it should exist now)
      let card = await getCard(clickedCountry)
      if (!card) {
        console.error('Card not found for country:', clickedCountry)
        return
      }

      // Track if this will be a level up before we modify the card
      const oldWinStreak = card.winStreak || 0
      const oldLevel = card.level || 0
      const requiredWinStreak = 
        oldLevel <= 2 ? 1 :  // Levels 0-2: need 1 win
        oldLevel <= 5 ? 2 :  // Levels 3-5: need 2 wins
        3                    // Levels 6+: need 3 wins
      const willLevelUp = isFirstTry.value && oldWinStreak + 1 === requiredWinStreak

      // First update our streaks and level
      updateCardStreaks(card, true, isFirstTry.value)

      // Then apply FSRS with our modified card
      const f = fsrs()
      const result = f.next(card, new Date(), rating)

      // Save with our modifications taking precedence for everything EXCEPT due date
      const finalCard = {
        ...result.card,           // FSRS base updates including due date
        countryName: clickedCountry, // Our overrides
        winStreak: card.winStreak,
        failStreak: card.failStreak,
        level: card.level,
        // Only override due date for level ups
        ...(willLevelUp && { due: new Date(new Date().getTime() + 30 * 1000) })
      }
      await saveCard(finalCard)

      // Dispatch progress update event
      window.dispatchEvent(new Event('learning-progress-update'))

      // Select next country after a short delay
      setTimeout(selectRandomCountry, 2000)
    } else {
      // Incorrect click
      if (isFirstTry.value) {
        isFirstTry.value = false
        targetCountryIsHighlighted.value = true
        message.value = `Nope, ${targetCountryToClick.value} is highlighted now. Try again!`
      } else {
        // Failed second attempt
        message.value = `That's not quite right. ${targetCountryToClick.value} was highlighted.`
        
        let card = await getCard(targetCountryToClick.value)
        if (!card) {
          console.error('Card not found for country:', targetCountryToClick.value)
          return
        }

        // First update our streaks and level
        updateCardStreaks(card, false, false)

        // Then apply FSRS with our modified card
        const f = fsrs()
        const result = f.next(card, new Date(), Rating.Again)

        // Save with our modifications taking precedence for everything EXCEPT due date
        const finalCard = {
          ...result.card,           // FSRS base updates including due date
          countryName: targetCountryToClick.value, // Our overrides
          winStreak: card.winStreak,
          failStreak: card.failStreak,
          level: card.level
        }
        await saveCard(finalCard)

        // Dispatch progress update event
        window.dispatchEvent(new Event('learning-progress-update'))

        // Move to next country after a delay
        setTimeout(selectRandomCountry, 2000)
      }
    }
  }

  return {
    targetCountryToClick: computed(() => targetCountryToClick.value),
    message: computed(() => message.value),
    targetCountryIsHighlighted: computed(() => targetCountryIsHighlighted.value),
    setAvailableCountries,
    selectRandomCountry,
    handleCountryClick,
    handleGameCompletion
  }
} 