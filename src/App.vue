<template>
    <header>
        <nav class="flex gap-2 flex-row">
            <router-link :to="{ name: 'home' }">Home</router-link>
            <router-link :to="{ name: 'map-game-circle' }">Map Game 2</router-link>
        </nav>
    </header>
    <div class="bg-red-200 btn-primary btn">test</div>
    <main>
      <RouterView />
    </main>
</template>
