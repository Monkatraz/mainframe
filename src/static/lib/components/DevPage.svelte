<script lang='ts'>
  import { fade } from 'svelte/transition'
  import { tnAnime, TabControl, Tab } from '@components'

  const pageReveal = {
    opacity: {
      value: [0, 1],
      duration: 300,
      easing: 'easeOutQuad',
      delay: 100
    },
    translateY: {
      value: ['-4rem', '0rem'],
      duration: 800,
      easing: 'easeOutElastic(2, 2)'
    }
  }

</script>

<!--
<div
  style="
    position: absolute;
    top: {'test'}px;
    left: func(calc(100% - 20px));
    right: var(--some-var);
    asdf: 'cool {beans}'
  "
></div>

<div style="background: #ffe7e8; border: 2px solid #e66465;">
  <p style="margin: 15px; line-height: 1.5; text-align: center;">
      Well, I am the slime from your video<br>
      Oozin' along on your livin' room floor.</p>
</div>

<div style="background-color: black; height: 200px; width: 200px;"></div>
<div style="background-color: rgb(255, 0, 255); height: 200px; width: 200px;"></div>
<div style="background-color: #333666; height: 200px; width: 200px;"></div>

<div hidden style="width: 100%" --text-color="red"/>
-->

<div role='presentation' out:fade={{ duration: 100 }}>
  <div class='rhythm' role='presentation' in:tnAnime={pageReveal}>
    <TabControl>
      <Tab>
        <slot slot='button'>Test Tab</slot>
        Some content!
      </Tab>
      <Tab>
        <slot slot='button'>Test Tab 2</slot>
        Some MORE content!
      </Tab>
      <Tab>
        <slot slot='button'>Test Tab 3</slot>
        okay you get it
      </Tab>
      <Tab>
        <slot slot='button'>Article</slot>
        <p>
          SCP-XXXX is a spacetime anomaly located within the obliterated core of the Chernobyl Power Plant’s No. 4 reactor, in Pripyat, Ukraine. It is naturally propagating anomaly, and is attempting to radiate out of the reactor core. It is prevented from doing so by a confinement singularity. SCP-XXXX has a widespread influence on reality, being directly responsible for a long series of anomalous phenomena that has been occurring within the Chernobyl exclusion zone since 1986.
        </p>
        <p>
          SCP-XXXX has a small region of influence, and within this region induces radical alterations of the observed behavior of ordinary natural phenomena. This particular characteristic is an arguably natural phenomena, an expected result from the observed loss of metastability of multiple physical fields, or a ‘true vacuum’, within the anomaly. It is generally concluded that the Higgs, electromagnetic, and at least one unknown particle have decayed from metastability into a more stable ground state.
        </p>
      </Tab>
    </TabControl>
  </div>
</div>

<style lang='stylus'>
  @require '_lib'
</style>
