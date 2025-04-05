<template>
  <div class="cloze-generator">
    <div class="upload-section">
      <input 
        type="file" 
        accept=".csv" 
        @change="handleFileUpload" 
        ref="fileInput"
      >
      <button 
        @click="generateClozeCards" 
        :disabled="!csvData.length"
        class="generate-btn"
      >
        Generate Cloze Cards
      </button>
      <button 
        @click="downloadAllFiles" 
        :disabled="!generatedFiles.length"
        class="download-btn"
      >
        Download MD Files
      </button>
      <button 
        @click="downloadAnkiFile" 
        :disabled="!generatedFiles.length"
        class="anki-btn"
      >
        Download Anki CSV
      </button>
    </div>

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div v-if="generatedFiles.length" class="stats">
      Generated {{ generatedFiles.length }} cloze cards
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Papa from 'papaparse'

const csvData = ref([])
const generatedFiles = ref([])
const error = ref('')

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  Papa.parse(file, {
    header: true,
    complete: (results) => {
      if (results.data.length === 0) {
        error.value = 'CSV file is empty'
        return
      }

      // Validate CSV structure
      const firstRow = results.data[0]
      if (!firstRow.native || !firstRow.target) {
        error.value = 'CSV must have "native" and "target" columns'
        return
      }

      csvData.value = results.data
      error.value = ''
    },
    error: (err) => {
      error.value = 'Error parsing CSV: ' + err.message
    }
  })
}

const generateClozeCards = () => {
  generatedFiles.value = []
  
  csvData.value.forEach((row, index) => {
    const targetWords = row.target.split(' ')
    
    targetWords.forEach((_, wordIndex) => {
      const clozeSentence = targetWords.map((word, i) => 
        i === wordIndex ? '＿' : word
      ).join(' ')
      
      const template = `---
title: ${clozeSentence}
q:
  template: learn
---

### ${row.native}

> [!NOTE]- ?
> ## ${row.target}
`
      
      generatedFiles.value.push({
        content: template,
        filename: `cloze_${index + 1}_word_${wordIndex + 1}.md`,
        clozeSentence,
        native: row.native,
        target: row.target
      })
    })
  })
}

const downloadAllFiles = () => {
  generatedFiles.value.forEach(file => {
    const blob = new Blob([file.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  })
}

const downloadAnkiFile = () => {
  // Create Anki-compatible CSV content
  const ankiRows = generatedFiles.value.map(file => {
    // Find which word was replaced with ＿
    const targetWords = file.target.split(' ')
    const clozeWords = file.clozeSentence.split(' ')
    const missingWordIndex = clozeWords.findIndex(word => word === '＿')
    const missingWord = targetWords[missingWordIndex]
    
    // Create bold version of target sentence
    const boldTarget = targetWords.map((word, i) => 
      i === missingWordIndex ? `<b>${word}</b>` : word
    ).join(' ')
    
    // Front: Cloze sentence + Native sentence
    const front = `${file.clozeSentence}<br><br>${file.native}`
    
    // Back: Complete sentence with bold missing word
    const back = boldTarget

    return [front, back].join(',')
  })

  // Add header row
  const ankiContent = ['#separator:,', '#html:true', '#deck:Cloze Cards', ''].concat(ankiRows).join('\n')

  // Create and download the file
  const blob = new Blob([ankiContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'anki_cloze_cards.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.cloze-generator {
  padding: 20px;
}

.upload-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.error {
  color: red;
  margin: 10px 0;
}

.stats {
  margin-top: 10px;
  color: #666;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #4CAF50;
  color: white;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.download-btn {
  background-color: #2196F3;
}

.anki-btn {
  background-color: #9C27B0;
}
</style>
