<svelte:head>
  <title>Historical Sites Extra Info</title>
</svelte:head>

<script>
  export let data;
  let query = '';

  $: needle = query.trim().toLowerCase();
  $: filteredSites = data.sites.filter((site) => {
    if (!needle) return true;
    return (
      site.name.toLowerCase().includes(needle) ||
      site.region.toLowerCase().includes(needle) ||
      site.epoch.toLowerCase().includes(needle) ||
      site.materials.join(' ').toLowerCase().includes(needle) ||
      site.tools.join(' ').toLowerCase().includes(needle)
    );
  });
</script>

<main class="extra-page">
  <a class="back-link" href="/sites">← Back to timeline</a>

  <header class="hero">
    <p class="eyebrow">Published Path</p>
    <h1>/sites/extra/info</h1>
    <p class="summary">
      Extra reference data for all site galleries: construction materials, likely tools, methods, and source-link coverage.
    </p>
  </header>

  <section class="metrics">
    <article>
      <strong>{data.stats.siteCount}</strong>
      <span>Sites</span>
    </article>
    <article>
      <strong>{data.stats.totalImageCount}</strong>
      <span>Gallery images</span>
    </article>
    <article>
      <strong>{data.stats.sitesWithConstruction}</strong>
      <span>Sites with construction profiles</span>
    </article>
    <article>
      <strong>{data.stats.totalSourceLinks}</strong>
      <span>Construction source links</span>
    </article>
  </section>

  <section class="insights">
    <article class="panel">
      <h2>Most Referenced Materials</h2>
      <div class="chips">
        {#each data.topMaterials as item}
          <span>{item.name} · {item.count}</span>
        {/each}
      </div>
    </article>

    <article class="panel">
      <h2>Most Referenced Tools</h2>
      <div class="chips">
        {#each data.topTools as item}
          <span>{item.name} · {item.count}</span>
        {/each}
      </div>
    </article>

    <article class="panel">
      <h2>Source Types</h2>
      <ul class="source-types">
        {#each data.topSourceTypes as item}
          <li>{item.name}: {item.count}</li>
        {/each}
      </ul>
    </article>
  </section>

  <section class="site-list">
    <div class="list-head">
      <h2>Site-by-Site Extra Info</h2>
      <input
        type="search"
        bind:value={query}
        placeholder="Filter by site, region, epoch, material, or tool..."
        aria-label="Filter sites"
      />
    </div>

    <div class="rows">
      {#each filteredSites as site}
        <article class="row">
          <h3><a href={`/sites/${site.slug}`}>{site.name}</a></h3>
          <p class="meta">{site.region} · {site.epoch} · {site.yearRange}</p>
          <p class="counts">{site.imageCount} images · {site.materials.length} materials · {site.tools.length} tools</p>

          <div class="group">
            <strong>Materials</strong>
            <p>{site.materials.join(', ')}</p>
          </div>

          <div class="group">
            <strong>Methods</strong>
            <p>{site.methods.join(', ')}</p>
          </div>

          <div class="group">
            <strong>Likely tools</strong>
            <p>{site.tools.join(', ')}</p>
          </div>

          <div class="group">
            <strong>Construction sources</strong>
            <ul>
              {#each site.sources as source}
                <li><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>
              {/each}
            </ul>
            {#if site.updated}
              <p class="updated">Updated: {site.updated}</p>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    background: radial-gradient(circle at top, #f7f0df 0%, #ead9bc 60%, #e2c79f 100%);
    color: #2a1d11;
    font-family: 'Fraunces', 'Cormorant Garamond', 'Palatino Linotype', serif;
  }

  .extra-page {
    max-width: 1160px;
    margin: 0 auto;
    padding: 1rem;
  }

  .back-link {
    display: inline-block;
    margin-bottom: 0.75rem;
    font-weight: 700;
    color: #17506f;
    text-decoration: none;
  }

  .hero {
    border: 1px solid #d5b37f;
    border-radius: 16px;
    background: linear-gradient(130deg, #fff8ea, #f4e2c4);
    padding: 1rem;
  }

  .eyebrow {
    margin: 0;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #8d6232;
    font-size: 0.75rem;
    font-weight: 700;
  }

  h1 {
    margin: 0.35rem 0 0.4rem;
    font-size: clamp(1.45rem, 3.4vw, 2.4rem);
  }

  .summary {
    margin: 0;
    color: #5a4529;
    max-width: 85ch;
  }

  .metrics {
    margin-top: 0.8rem;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.7rem;
  }

  .metrics article {
    border: 1px solid #d8bb90;
    border-radius: 12px;
    background: rgba(255, 250, 240, 0.92);
    padding: 0.6rem 0.7rem;
    display: grid;
    gap: 0.2rem;
  }

  .metrics strong {
    font-size: 1.2rem;
  }

  .metrics span {
    color: #6b5538;
    font-size: 0.84rem;
  }

  .insights {
    margin-top: 0.85rem;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.7rem;
  }

  .panel {
    border: 1px solid #d5b88e;
    border-radius: 12px;
    background: rgba(255, 250, 241, 0.94);
    padding: 0.75rem;
  }

  .panel h2 {
    margin: 0 0 0.55rem;
    font-size: 1.05rem;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .chips span {
    display: inline-block;
    border: 1px solid #d6b788;
    border-radius: 999px;
    padding: 0.16rem 0.55rem;
    font-size: 0.78rem;
    background: #fff8ea;
  }

  .source-types {
    margin: 0;
    padding-left: 1rem;
  }

  .source-types li {
    margin: 0.2rem 0;
  }

  .site-list {
    margin-top: 0.9rem;
    border: 1px solid #d5b88c;
    border-radius: 14px;
    background: rgba(255, 250, 243, 0.95);
    padding: 0.85rem;
  }

  .list-head {
    display: flex;
    gap: 0.8rem;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.7rem;
  }

  .list-head h2 {
    margin: 0;
    font-size: 1.15rem;
  }

  .list-head input {
    width: min(510px, 100%);
    border: 1px solid #ccab7a;
    border-radius: 10px;
    background: #fffdf8;
    padding: 0.55rem 0.7rem;
    font-size: 0.92rem;
  }

  .rows {
    display: grid;
    gap: 0.65rem;
  }

  .row {
    border: 1px solid #d8bf99;
    border-radius: 10px;
    background: #fff9ee;
    padding: 0.65rem;
  }

  .row h3 {
    margin: 0;
    font-size: 1rem;
  }

  .row h3 a {
    color: #184f70;
    text-decoration: none;
  }

  .row h3 a:hover {
    text-decoration: underline;
  }

  .meta,
  .counts {
    margin: 0.18rem 0 0;
    color: #654f30;
    font-size: 0.85rem;
  }

  .group {
    margin-top: 0.45rem;
  }

  .group strong {
    font-size: 0.87rem;
    color: #4d3a22;
  }

  .group p {
    margin: 0.15rem 0 0;
    font-size: 0.83rem;
    line-height: 1.3;
  }

  .group ul {
    margin: 0.15rem 0 0;
    padding-left: 1rem;
  }

  .group li {
    margin: 0.14rem 0;
    font-size: 0.8rem;
  }

  .group a {
    color: #1c5978;
    text-decoration: none;
  }

  .group a:hover {
    text-decoration: underline;
  }

  .updated {
    margin-top: 0.3rem;
    color: #76613f;
    font-size: 0.76rem;
  }

  @media (max-width: 1000px) {
    .metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .insights {
      grid-template-columns: 1fr;
    }

    .list-head {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
