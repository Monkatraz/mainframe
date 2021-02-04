<script lang='ts'>
  import { User, authed } from '../modules/api'
  import {
    tnAnime, toast, matchMedia, Pref,
    Icon, Toggle, DetailsMenu, TextInput, Button, Card
  } from '@components'

  let busy = false

  // -- REGISTER

  let registerEmail: HTMLInputElement
  let registerPass: HTMLInputElement

  async function register() {
    if (!registerEmail || !registerPass) return
    if (registerEmail.validity.valid && registerPass.validity.valid) {
      busy = true
      try {
        await User.guestRegister(registerEmail.value, registerPass.value)
        toast('success', 'Successfully registered! You may now login with your chosen email and password.')
        registerEmail.value = ''
        registerPass.value = ''
      } catch {
        toast('danger', 'Failed to register.')
      }
      busy = false
    }
  }

  // -- LOGIN

  let loginEmail: HTMLInputElement
  let loginPass: HTMLInputElement
  const rememberMe = Pref.bind('remember-me', false)

  async function login() {
    if (!loginEmail || !loginPass) return
    if (loginEmail.validity.valid && loginPass.validity.valid) {
      busy = true
      try {
        await User.login(loginEmail.value, loginPass.value, $rememberMe)
        toast('success', 'Logged in!')
      } catch {
        toast('danger', 'Failed to login. Check your email and password.')
      }
      busy = false
    }
  }

  // -- LOGOUT

  async function logout() {
    if (!authed) return
    try {
      await User.logout()
      toast('info', 'Logged out.')
    } catch {
      toast('danger', 'Failed to logout - try again in a moment.')
    }
  }
</script>

{#if !$authed}
  <div class='guest' role='presentation'
    in:tnAnime={{ opacity: [0,1], easing: 'easeOutExpo' }}
  >
    <DetailsMenu placement='bottom-end'>
      <slot slot='summary'>
        <Button summary baseline>
          {#if $matchMedia('small', 'below')}
            REGISTER
          {:else}
            <Icon i='fluent:add-12-filled' size='1.5rem'/> Create Account
          {/if}
        </Button>
      </slot>
      <Card title='Register'>
        <form>
          <TextInput bind:input={registerEmail} on:enter={() => { registerPass.focus() }}
            label='Email' type='email' placeholder='Enter email address...' required
            disabled={busy}
            autocomplete='username'
            info='Your email is private.'
          />
          <TextInput bind:input={registerPass} on:enter={() => { register() }}
            label='Password' type='password' placeholder='Enter password...' required
            disabled={busy}
            autocomplete='new-password'
            minLength='6' maxLength='32'
            info='Between 6 and 32 characters.'
          />
        </form>
        <div class='mt-3'>
          <Button on:click={register} disabled={busy} wide primary>Register</Button>
        </div>
      </Card>
    </DetailsMenu>

    {#if $matchMedia('small', 'up')}<span class='tx-subtle mx-2'>or</span>{/if}

    <DetailsMenu placement='bottom-end'>
      <slot slot='summary'>
        <Button summary baseline>
          {#if $matchMedia('small', 'below')}
            LOGIN
          {:else}
            <Icon i='ion:log-in-outline' size='1.5rem'/> Login
          {/if}
        </Button>
      </slot>
      <Card title='Login'>
        <form>
          <TextInput bind:input={loginEmail} on:enter={() => { loginPass.focus() }}
            label='Email' type='email' placeholder='Enter email address...' required
            disabled={busy}
            autocomplete='username'
          />
          <TextInput bind:input={loginPass} on:enter={() => { login() }}
            label='Password' type='password' placeholder='Enter password...' required
            disabled={busy}
            autocomplete='current-password'
            minLength='6' maxLength='32'
          />
        </form>
        <Toggle bind:toggled={$rememberMe}>Remember Me</Toggle>
        <div class='submit'>
          <Button on:click={login} disabled={busy} wide primary>Login</Button>
        </div>
      </Card>
    </DetailsMenu>
  </div>
{:else}
  <div class='user' role='presentation'
    in:tnAnime={{ opacity: [0,1], easing: 'easeOutExpo' }}
  >
    <DetailsMenu placement='bottom-end'>
      <slot slot='summary'>
        <Button summary baseline>
          <span class='mr-2'>{User.authed ? User.social.nickname : ''}</span>
          <Icon i='carbon:user-avatar-filled-alt' size='1.75rem'/>
        </Button>
      </slot>
      <Card>
        <Button on:click={logout} wide>Logout</Button>
      </Card>
    </DetailsMenu>
  </div>
{/if}
