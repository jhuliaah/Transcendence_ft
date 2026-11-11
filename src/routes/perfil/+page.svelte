<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  let emailNotifications = $state(true);

  const displayName = $derived(data.user.name || data.user.email);
  const initial = $derived(displayName.charAt(0).toUpperCase());
</script>

<svelte:head>
  <title>Seu perfil | Transcendence</title>
  <meta name="description" content="Gerencie seu perfil e suas preferências." />
</svelte:head>

<div class="page-container">
  <header class="top-bar">
    <button class="btn-back" type="button" aria-label="Voltar" onclick={() => goto('/dashboard')}>
      ←
    </button>
    <h1 class="page-title">Seu perfil</h1>
  </header>

  <main class="content">
    <section class="user-info" aria-labelledby="profile-name">
      <div class="avatar" aria-hidden="true">{initial}</div>
      <div class="user-details">
        <h2 id="profile-name">{displayName}</h2>
        <p>{data.user.email}</p>
      </div>
    </section>

    <section class="section-group" aria-labelledby="communities-title">
      <h3 id="communities-title" class="section-title">Suas comunidades</h3>
      <div class="card">
        {#if data.communities.length > 0}
          {#each data.communities as community}
            <button class="list-item community-item" type="button">
              <span class="comm-avatar" aria-hidden="true">{community.initial}</span>
              <span class="comm-name">{community.name}</span>
              {#if community.role}
                <span class="badge">{community.role}</span>
              {/if}
            </button>
          {/each}
        {:else}
          <p class="empty-state">Você ainda não participa de nenhuma comunidade.</p>
        {/if}
      </div>
    </section>

    <section class="section-group" aria-labelledby="settings-title">
      <h3 id="settings-title" class="section-title">Configurações</h3>
      <div class="card">
        <button class="list-item settings-item" type="button">
          Avisos <span class="arrow" aria-hidden="true">›</span>
        </button>

        <button
          class="list-item settings-item"
          type="button"
          aria-pressed={emailNotifications}
          onclick={() => (emailNotifications = !emailNotifications)}
        >
          Avisos por e-mail
          <span class:active={emailNotifications} class="toggle-track" aria-hidden="true">
            <span class="toggle-thumb"></span>
          </span>
        </button>

        <button class="list-item settings-item" type="button">
          Privacidade e Termos <span class="arrow" aria-hidden="true">›</span>
        </button>
      </div>
    </section>

    <form method="POST" action="/logout">
      <button class="btn-logout" type="submit">Sair</button>
    </form>
  </main>
</div>

<style>
  .page-container {
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - 73px);
    background-color: #f9edd7;
    color: #001a32;
  }

  .top-bar {
    height: 68px;
    background-color: #001a32;
    color: #f9edd7;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 14px;
    flex-shrink: 0;
  }

  .btn-back {
    width: 40px;
    height: 40px;
    border-radius: 20px;
    border: none;
    background-color: #092e4c;
    color: #f9edd7;
    font-size: 18px;
    cursor: pointer;
  }

  .page-title {
    font-size: 18px;
    font-weight: 800;
    margin: 0;
  }

  .content {
    flex: 1;
    max-width: 620px;
    margin: 0 auto;
    width: 100%;
    padding: 24px 16px 32px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .avatar,
  .comm-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-weight: 800;
  }

  .avatar {
    width: 76px;
    height: 76px;
    border-radius: 50%;
    background-color: #001a32;
    color: #cf9612;
    border: 3px solid #cf9612;
    font-size: 30px;
  }

  .user-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .user-details h2 {
    font-size: 24px;
    font-weight: 800;
    line-height: 1.1;
    margin: 0;
  }

  .user-details p,
  .section-title {
    color: #4a5c6e;
  }

  .user-details p {
    font-size: 15px;
    margin: 0;
  }

  .section-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 800;
    margin: 0;
  }

  .card {
    background-color: #fffbfc;
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    padding: 4px 0;
  }

  .list-item {
    display: flex;
    align-items: center;
    padding: 16px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #001a32;
    width: 100%;
    text-align: left;
  }

  .community-item {
    gap: 12px;
    padding: 10px 16px;
  }

  .comm-avatar {
    width: 36px;
    height: 36px;
    border-radius: 18px;
    background-color: #cf9612;
    color: #001a32;
    font-size: 15px;
  }

  .comm-name {
    flex: 1;
    font-size: 15px;
    font-weight: 700;
  }

  .badge {
    font-size: 11px;
    font-weight: 800;
    background-color: #001a32;
    color: #f9edd7;
    border-radius: 6px;
    padding: 3px 8px;
  }

  .empty-state {
    color: #4a5c6e;
    font-size: 14px;
    margin: 0;
    padding: 16px;
  }

  .settings-item {
    justify-content: space-between;
    font-size: 15px;
    font-weight: 700;
    border-bottom: 1px solid rgb(0 26 50 / 8%);
  }

  .settings-item:last-child {
    border-bottom: none;
  }

  .arrow {
    color: #4a5c6e;
    font-size: 18px;
  }

  .toggle-track {
    width: 46px;
    height: 28px;
    border-radius: 14px;
    background-color: #a0aab5;
    display: flex;
    align-items: center;
    padding: 3px;
    box-sizing: border-box;
    transition: background-color 0.3s ease;
  }

  .toggle-track.active {
    background-color: #0b523d;
    justify-content: flex-end;
  }

  .toggle-thumb {
    width: 22px;
    height: 22px;
    border-radius: 11px;
    background-color: #fff;
    box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
  }

  .btn-logout {
    width: 100%;
    height: 48px;
    border: 1.5px solid #b32e16;
    border-radius: 14px;
    background: transparent;
    color: #b32e16;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    margin-top: 4px;
  }

  .btn-logout:hover {
    background-color: rgb(179 46 22 / 10%);
  }
</style>
