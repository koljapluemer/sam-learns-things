<template>
    hello, welcome.

    <div class="grid gap-2">
        <router-link class="btn btn-sm" :to="{ name: 'cloze-generator' }">Cloze Generator</router-link>
        <router-link class="btn btn-sm" :to="{ name: 'learn-flags' }">Learn Flags</router-link>
    </div>
</template>