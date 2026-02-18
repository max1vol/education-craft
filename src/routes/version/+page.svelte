<svelte:head>
  <title>Version & Changelog</title>
</svelte:head>

<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<main class="version-page">
  <section class="card">
    <p class="kicker">Build Info</p>
    <h1>{data.version.label}</h1>
    <p class="meta">
      Package `v{data.version.packageVersion}` • Branch `{data.version.branch}` • Commit `{data.version.commitShort}`
    </p>
    <p class="hash">{data.version.commitHash}</p>
    <p class="meta">Snapshot generated {new Date(data.version.generatedAt).toLocaleString()}</p>
  </section>

  {#if data.version.latest}
    <section class="card">
      <p class="kicker">Latest Version Notes</p>
      <h2>{data.version.latest.title}</h2>
      <p class="meta">{data.version.latest.date} • {data.version.latest.shortHash}</p>
    </section>
  {/if}

  <section class="card">
    <p class="kicker">Previous Versions (Recent History)</p>
    <ul>
      {#each data.version.history as entry}
        <li>
          <span class="row-top">{entry.title}</span>
          <span class="row-meta">{entry.date} • {entry.shortHash}</span>
        </li>
      {/each}
    </ul>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
    background: #06101a;
    color: #e9f3ff;
  }

  .version-page {
    min-height: 100vh;
    padding: calc(env(safe-area-inset-top, 0px) + 1rem) calc(env(safe-area-inset-right, 0px) + 0.9rem)
      calc(env(safe-area-inset-bottom, 0px) + 1.1rem) calc(env(safe-area-inset-left, 0px) + 0.9rem);
    display: grid;
    gap: 0.8rem;
    max-width: 52rem;
    margin: 0 auto;
  }

  .card {
    border: 1px solid rgba(148, 188, 228, 0.24);
    border-radius: 12px;
    background: linear-gradient(165deg, rgba(10, 24, 40, 0.9), rgba(6, 15, 26, 0.92));
    padding: 0.85rem 0.9rem;
  }

  .kicker {
    margin: 0;
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9fc1e3;
  }

  h1,
  h2 {
    margin: 0.3rem 0 0.2rem;
    line-height: 1.2;
  }

  h1 {
    font-size: clamp(1.02rem, 3.5vw, 1.45rem);
    color: #f1fbff;
  }

  h2 {
    font-size: clamp(0.94rem, 3vw, 1.15rem);
    color: #ecf6ff;
  }

  .meta,
  .hash,
  .row-meta {
    margin: 0;
    font-size: 0.75rem;
    color: #bfd5ec;
  }

  .hash {
    margin: 0.35rem 0 0.2rem;
    word-break: break-all;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color: #e3f3ff;
  }

  ul {
    margin: 0.4rem 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.52rem;
  }

  li {
    border-radius: 10px;
    border: 1px solid rgba(146, 188, 226, 0.16);
    padding: 0.52rem 0.62rem;
    background: rgba(6, 16, 28, 0.65);
  }

  .row-top {
    display: block;
    font-size: 0.84rem;
    color: #e9f6ff;
  }

  .row-meta {
    display: block;
    margin-top: 0.2rem;
    color: #a5c0dc;
  }
</style>
