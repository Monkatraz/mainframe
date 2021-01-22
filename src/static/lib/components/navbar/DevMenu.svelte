<script lang='ts'>
  import { toast, Button, Card, DetailsMenu, Icon } from '@components'
</script>

<DetailsMenu hover placement='bottom-start'>
  <slot slot='summary'>
    <Button summary baseline>DEVMENU <Icon i='bi:caret-down-fill'/></Button>
  </slot>
  <Card width='16rem' title='Development Menu'>
    <div role='presentation'>
      <Button i='fluent:food-toast-16-filled' size='2rem' baseline tip='Toast!'
        on:click={() => toast('info', 'Toast!')} />
    </div>
  </Card>
</DetailsMenu>