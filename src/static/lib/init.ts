import Iconify from '@iconify/iconify'
import AppComponent from './App.svelte'

// adds a Iconify SCP outline logo
Iconify.addIcon('@c:scp:logo', {
  body:
    `<g shape-rendering="geometricPrecision" fill="currentColor" stroke="currentColor" stroke-width="5">
      <path d="M795 610a260 260 0 00-170-294l-8-57H463l-8 57-10 3a260 260 0 00-160 291l-45 36 77 133 53-21a260 260 0 00340 0l53 21 77-133zm-45 130l-47-18-7 7a229 229 0 01-312 0l-7-7-47 18-50-87 39-31-2-9a229 229 0 01139-265l17-5 10-3 7-50h100l7 50 10 3a229 229 0 01156 270l-2 9 39 31z"/>
      <path d="M407 560c0-68 51-124 117-132v36h-23l39 67 39-67h-23v-68a163 163 0 00-32 0c-83 8-149 79-149 164a164 164 0 008 51l28-16a133 133 0 01-4-35z"/>
      <path d="M540 694a133 133 0 01-107-54l30-17 12 20 39-67h-78l12 20-30 18-27 15a164 164 0 00271 42l-28-16a133 133 0 01-94 39z"/>
      <path d="M575 399v32c57 16 98 68 98 129a133 133 0 01-11 54l-30-18 12-20h-78l39 67 12-20 30 17 27 16a164 164 0 0031-96c0-78-56-145-130-161z"/>
    </g>`,
  top: 224,
  left: 224,
  width: 632,
  height: 632
})

const App = new AppComponent({ target: document.querySelector('#app')!, intro: true })