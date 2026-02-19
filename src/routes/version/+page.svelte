<svelte:head>
  <title>Version & Changelog</title>
</svelte:head>

<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  const formatTimestamp = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${date.toLocaleString()} (${date.toISOString()})`;
  };

  const formatRelativeAge = (unixTime: number): string => {
    const nowSeconds = Math.round(Date.now() / 1000);
    const delta = unixTime - nowSeconds;
    const absDelta = Math.abs(delta);

    if (absDelta < 60) return relativeFormatter.format(delta, 'second');
    if (absDelta < 3600) return relativeFormatter.format(Math.round(delta / 60), 'minute');
    if (absDelta < 86400) return relativeFormatter.format(Math.round(delta / 3600), 'hour');
    return relativeFormatter.format(Math.round(delta / 86400), 'day');
  };
</script>

<main class="version-page">
  <section class="card">
    <p class="kicker">Build Info</p>
    <h1>{data.version.label}</h1>
    <p class="meta">
      Package `v{data.version.packageVersion}` • Branch `{data.version.branch}` • Commit `{data.version.commitShort}`
    </p>
    <p class="hash">{data.version.commitHash}</p>
    <p class="meta">Snapshot generated {formatTimestamp(data.version.generatedAt)}</p>
  </section>

  {#if data.version.latest}
    <section class="card">
      <p class="kicker">Latest Version Notes</p>
      <h2>{data.version.latest.title}</h2>
      <p class="meta">Commit {data.version.latest.shortHash} • {data.version.latest.date}</p>
      <p class="meta">Latest commit age: {formatRelativeAge(data.version.latest.unixTime)}</p>
      <p class="row-meta">Timestamp: {formatTimestamp(data.version.latest.timestamp)}</p>
    </section>
  {/if}

  <section class="card">
    <p class="kicker">Previous Versions (Recent History)</p>
    <ul>
      {#each data.version.history as entry}
        <li>
          <span class="row-top">{entry.title}</span>
          <span class="row-meta">{entry.shortHash} • {entry.date} • {formatRelativeAge(entry.unixTime)}</span>
          <span class="row-meta">{formatTimestamp(entry.timestamp)}</span>
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
    border: 1px solid rgba(190, 220, 248, 0.42);
    border-radius: 12px;
    background: linear-gradient(165deg, rgba(10, 24, 40, 0.96), rgba(6, 15, 26, 0.98));
    padding: 0.85rem 0.9rem;
  }

  .kicker {
    margin: 0;
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #d8eeff;
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
    font-size: 0.77rem;
    color: #e4f1ff;
  }

  .hash {
    margin: 0.35rem 0 0.2rem;
    word-break: break-all;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color: #f6fbff;
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
    border: 1px solid rgba(179, 214, 246, 0.3);
    padding: 0.52rem 0.62rem;
    background: rgba(6, 16, 28, 0.8);
  }

  .row-top {
    display: block;
    font-size: 0.86rem;
    color: #f6fbff;
  }

  .row-meta {
    display: block;
    margin-top: 0.2rem;
    color: #dcedff;
    word-break: break-word;
  }
</style>
