<script lang="ts">
  export const hello: string = "world";
</script>

<style lang="stylus">
  @require '_lib'
  div
    color: red
</style>

<template lang="pug">
  div {hello}
</template>
