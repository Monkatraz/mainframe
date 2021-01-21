<script lang='ts'>
  import { User, authed } from '../modules/api'
  import { tnAnime } from '../modules/components'
  import Icon from './Icon.svelte'
  import Toggle from './Toggle.svelte'
  import Dropdown from './Dropdown.svelte'
  import TextInput from './TextInput.svelte'
  import Button from './Button.svelte'

  // -- REGISTER

  let registerEmail: HTMLInputElement
  let registerPass: HTMLInputElement

  async function register() {
    if (!registerEmail || !registerPass) return
    if (registerEmail.validity.valid && registerPass.validity.valid) {
      try {
        await User.guestRegister(registerEmail.value, registerPass.value)
      } catch {} finally {
        registerEmail.value = ''
        registerPass.value = ''
      }
    }
  }

  // -- LOGIN

  let loginEmail: HTMLInputElement
  let loginPass: HTMLInputElement
  let rememberMe = false

  async function login() {
    if (!loginEmail || !loginPass) return
    if (loginEmail.validity.valid && loginPass.validity.valid) {
      try {
        await User.login(loginEmail.value, loginPass.value, rememberMe)
      } catch {} finally {
        loginEmail.value = ''
        loginPass.value = ''
      }
    }
  }

  // -- LOGOUT

  async function logout() {
    if (!authed) return
    try {
      await User.logout()
    } catch {}
  }
</script>

<style lang='stylus'>
  @require '_lib'
  .log-btn
    display: flex
    gap: 0.25rem
    transition: color 0.15s

    +on-hover()
      color: colvar('hint')

    &.open
      color: colvar('hint')

  .user .log-btn
    color: colvar('text-subtle')

  .or
    color: colvar('text-subtle')
    margin: 0 0.25rem

</style>

{#if !$authed}
  <div class='guest' role='presentation'
    in:tnAnime={{ opacity: [0,1], easing: 'easeOutExpo' }}
  >
    <Dropdown>
      <span slot='label' class='log-btn' let:open class:open>
        <Icon i='fluent:add-12-filled' size='1.5rem'/> Create Account
      </span>
      <form>
        <TextInput bind:input={registerEmail} on:enter={() => { registerPass.focus() }}
          label='Email' type='email' placeholder='Enter email address...' required
          autocomplete='username'
          info='Your email is private.'
        />
        <TextInput bind:input={registerPass} on:enter={() => { register() }}
          label='Password' type='password' placeholder='Enter password...' required
          autocomplete='new-password'
          minLength='6' maxLength='32'
          info='Between 6 and 32 characters.'
        />
      </form>
      <div style='margin-top: 0.5rem;'><Button on:click={register} wide primary>Register</Button></div>
    </Dropdown>

    <span class='or'>or</span>

    <Dropdown>
      <span slot='label' class='log-btn' let:open class:open>
        <Icon i='ion:log-in-outline' size='1.5rem'/> Login
      </span>
      <form>
        <TextInput bind:input={loginEmail} on:enter={() => { loginPass.focus() }}
          label='Email' type='email' placeholder='Enter email address...' required
          autocomplete='username'
        />
        <TextInput bind:input={loginPass} on:enter={() => { login() }}
          label='Password' type='password' placeholder='Enter password...' required
          autocomplete='current-password'
          minLength='6' maxLength='32'
        />
      </form>
      <Toggle bind:toggled={rememberMe}>Remember Me</Toggle>
      <div class='submit'><Button on:click={login} wide primary>Login</Button></div>
    </Dropdown>
  </div>
{:else}
  <div class='user' role='presentation'
    in:tnAnime={{ opacity: [0,1], easing: 'easeOutExpo' }}
  >
    <Dropdown>
      <span slot='label' class='log-btn' let:open class:open>
        <span style='margin-right: 0.25rem'>{User.authed ? User.social.nickname : ''}</span>
        <Icon i='carbon:user-avatar-filled-alt' size='1.75rem'/>
      </span>
      <Button on:click={logout} wide>Logout</Button>
    </Dropdown>
  </div>
{/if}