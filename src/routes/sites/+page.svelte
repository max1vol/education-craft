<svelte:head>
  <title>Historical Sites Timeline</title>
</svelte:head>

<script>
  import { formatYear } from '$lib/data/sites';

  export let data;
  let query = '';

  $: lowered = query.trim().toLowerCase();
  $: filteredGroups = data.groups
    .map((group) => ({
      ...group,
      sites: group.sites.filter((site) => {
        if (!lowered) return true;
        return (
          site.name.toLowerCase().includes(lowered) ||
          site.region.toLowerCase().includes(lowered) ||
          site.epoch.toLowerCase().includes(lowered) ||
          site.idea.toLowerCase().includes(lowered)
        );
      })
    }))
    .filter((group) => group.sites.length > 0);
</script>

<main class="timeline-page">
  <section class="hero">
    <div class="hero-inner">
      <p class="eyebrow">Historical Reconstructions</p>
      <h1>Explore 64 Sites Across World History</h1>
      <p class="summary">
        Browse by epoch, compare regions, and open each site for image galleries, origin stories, and timeline events.
      </p>
      <div class="metrics">
        <div>
          <strong>{data.stats.totalSites}</strong>
          <span>Locations</span>
        </div>
        <div>
          <strong>{data.stats.totalImages}</strong>
          <span>Reconstruction Images</span>
        </div>
      </div>
      <input
        class="search"
        type="search"
        bind:value={query}
        placeholder="Search by site, region, epoch, or idea..."
        aria-label="Search sites"
      />
    </div>
  </section>

  <section class="timeline-wrap">
    {#if filteredGroups.length === 0}
      <p class="empty">No sites matched your search.</p>
    {:else}
      {#each filteredGroups as group}
        <section class="epoch">
          <header class="epoch-head">
            <h2>{group.epoch}</h2>
            <p>{formatYear(group.startYear)} to {formatYear(group.endYear)}</p>
          </header>

          <div class="cards">
            {#each group.sites as site}
              <a class="site-card" href={`/sites/${site.slug}`}>
                <div class="thumb">
                  {#if site.hero}
                    <img src={`/site-media/${site.slug}/${site.hero}`} alt={`Reconstruction of ${site.name}`} loading="lazy" />
                  {:else}
                    <div class="no-image">No image</div>
                  {/if}
                </div>
                <div class="meta">
                  <h3>{site.name}</h3>
                  <p class="region">{site.region}</p>
                  <p class="idea">{site.idea}</p>
                  <p class="dates">{site.yearRange}</p>
                  <p class="count">{site.count} images</p>
                </div>
              </a>
            {/each}
          </div>
        </section>
      {/each}
    {/if}
  </section>

  <section class="idea-section">
    <div class="idea-inner">
      <div class="idea-head">
        <p class="eyebrow">Classroom Extensions</p>
        <h2>16 Ways to Use Historical Site Facts</h2>
        <p>
          This section turns the same site data (origin stories, timelines, materials, tools, and sources)
          into structured learning activities. Each card follows a progressive path:
          <strong>Starter → Better → Advanced → Mastery</strong>.
        </p>
      </div>

      <div class="idea-grid">
        {#each data.siteFeatureIdeas as idea}
          <article class="idea-feature-card">
            <img src={idea.illustration} alt={`${idea.title} colourful concept illustration`} loading="lazy" />
            <div class="idea-feature-body">
              <p class="idea-feature-id">{idea.id}</p>
              <h3>{idea.title}</h3>
              <p class="idea-feature-summary">{idea.summary}</p>
              <p class="idea-feature-progress">
                <strong>Progression:</strong> {idea.progression.map((step) => step.name).join(' → ')}
              </p>
              <a class="idea-feature-link" href="/sites/extra/info">Open full blueprint details</a>
            </div>
          </article>
        {/each}
      </div>
    </div>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    background: radial-gradient(circle at top, #f9f3e6 0%, #efe1ca 48%, #e8d4b7 100%);
    color: #2b2217;
    font-family: 'Fraunces', 'Cormorant Garamond', 'Palatino Linotype', serif;
  }

  .timeline-page {
    min-height: 100vh;
  }

  .hero {
    padding: 1.2rem 1rem 0.8rem;
  }

  .hero-inner {
    max-width: 1100px;
    margin: 0 auto;
    background: linear-gradient(135deg, #fff7e8, #f6e5c8);
    border: 1px solid #dfc89f;
    border-radius: 18px;
    padding: 1.2rem;
    box-shadow: 0 10px 30px rgba(117, 85, 37, 0.16);
  }

  .eyebrow {
    margin: 0;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #8c6230;
    font-size: 0.78rem;
    font-weight: 700;
  }

  h1 {
    margin: 0.35rem 0 0.55rem;
    font-size: clamp(1.5rem, 3.2vw, 2.4rem);
    line-height: 1.15;
  }

  .summary {
    margin: 0;
    max-width: 75ch;
    color: #4b3b27;
    font-size: 1rem;
  }

  .metrics {
    display: flex;
    gap: 1rem;
    margin: 1rem 0 0.8rem;
  }

  .metrics div {
    display: flex;
    flex-direction: column;
    padding: 0.55rem 0.75rem;
    border: 1px solid #d7bc92;
    border-radius: 10px;
    background: rgba(255, 253, 247, 0.85);
    min-width: 135px;
  }

  .metrics strong {
    font-size: 1.15rem;
  }

  .metrics span {
    font-size: 0.8rem;
    color: #715b3f;
  }

  .search {
    width: 100%;
    border: 1px solid #cfae7e;
    border-radius: 11px;
    padding: 0.72rem 0.85rem;
    font-size: 0.98rem;
    background: #fffcf5;
  }

  .timeline-wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0.2rem 1rem 2.2rem;
  }

  .epoch {
    margin-top: 1.1rem;
    border-left: 4px solid #b88a51;
    padding-left: 0.85rem;
  }

  .epoch-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.7rem;
  }

  .epoch h2 {
    margin: 0;
    font-size: 1.25rem;
  }

  .epoch-head p {
    margin: 0;
    color: #6e5838;
    font-size: 0.86rem;
    white-space: nowrap;
  }

  .cards {
    margin-top: 0.65rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 0.8rem;
  }

  .site-card {
    display: flex;
    flex-direction: column;
    border: 1px solid #d2b488;
    border-radius: 12px;
    overflow: hidden;
    background: #fffaf0;
    text-decoration: none;
    color: inherit;
    transition: transform 160ms ease, box-shadow 160ms ease;
  }

  .site-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(83, 54, 14, 0.18);
  }

  .thumb {
    padding: 0.35rem;
    background: #f8eed9;
    min-height: 170px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .thumb img {
    width: auto;
    max-width: 100%;
    height: auto;
    max-height: 240px;
    object-fit: contain;
    display: block;
    border-radius: 6px;
  }

  .no-image {
    color: #7c6748;
    font-size: 0.85rem;
  }

  .meta {
    padding: 0.6rem 0.7rem 0.75rem;
  }

  .meta h3 {
    margin: 0 0 0.35rem;
    font-size: 1.02rem;
    line-height: 1.2;
  }

  .region,
  .idea,
  .dates,
  .count {
    margin: 0.2rem 0 0;
    font-size: 0.84rem;
    color: #58472f;
  }

  .count {
    font-weight: 700;
  }

  .empty {
    margin: 1rem 0;
    padding: 0.9rem;
    border-radius: 10px;
    border: 1px solid #d0b182;
    background: #fff7ea;
  }

  .idea-section {
    padding: 0.4rem 1rem 2.3rem;
  }

  .idea-inner {
    max-width: 1100px;
    margin: 0 auto;
    border: 1px solid #d5b88b;
    border-radius: 18px;
    background: linear-gradient(135deg, #fff9ec, #f2dfc2);
    padding: 1rem;
    box-shadow: 0 10px 26px rgba(95, 65, 23, 0.14);
  }

  .idea-head h2 {
    margin: 0.35rem 0 0.5rem;
    font-size: clamp(1.25rem, 2.4vw, 1.9rem);
  }

  .idea-head p {
    margin: 0;
    color: #533f25;
    line-height: 1.45;
    max-width: 92ch;
  }

  .idea-grid {
    margin-top: 0.9rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 0.8rem;
  }

  .idea-feature-card {
    border: 1px solid #d6bc96;
    border-radius: 13px;
    overflow: hidden;
    background: #fffaf1;
    display: grid;
  }

  .idea-feature-card img {
    width: 100%;
    height: auto;
    object-fit: contain;
    display: block;
    background: #eee0ca;
  }

  .idea-feature-body {
    padding: 0.68rem;
  }

  .idea-feature-id {
    margin: 0;
    font-size: 0.77rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: #8e6434;
  }

  .idea-feature-body h3 {
    margin: 0.28rem 0 0.18rem;
    font-size: 1rem;
    line-height: 1.25;
  }

  .idea-feature-summary {
    margin: 0;
    color: #58462d;
    font-size: 0.84rem;
    line-height: 1.35;
  }

  .idea-feature-progress {
    margin: 0.35rem 0 0;
    color: #493722;
    font-size: 0.79rem;
    line-height: 1.3;
  }

  .idea-feature-link {
    margin-top: 0.45rem;
    display: inline-block;
    font-size: 0.82rem;
    font-weight: 700;
    color: #1a5b80;
    text-decoration: none;
  }

  .idea-feature-link:hover {
    text-decoration: underline;
  }

  @media (max-width: 700px) {
    .hero-inner {
      padding: 1rem;
    }

    .metrics {
      flex-wrap: wrap;
      gap: 0.55rem;
    }

    .metrics div {
      min-width: 0;
      flex: 1;
    }

    .idea-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 560px) {
    .hero {
      padding: 0.85rem 0.65rem 0.6rem;
    }

    .hero-inner {
      padding: 0.86rem;
      border-radius: 14px;
    }

    .summary {
      font-size: 0.92rem;
      line-height: 1.35;
    }

    .timeline-wrap {
      padding: 0.1rem 0.65rem 1.55rem;
    }

    .epoch {
      padding-left: 0.62rem;
      border-left-width: 3px;
    }

    .epoch-head {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.2rem;
    }

    .epoch-head p {
      white-space: normal;
      line-height: 1.25;
    }

    .cards {
      grid-template-columns: minmax(0, 1fr);
    }

    .thumb {
      min-height: 132px;
    }

    .meta h3,
    .region,
    .idea,
    .dates,
    .count {
      overflow-wrap: anywhere;
    }
  }

  @media (max-width: 380px) {
    .metrics {
      flex-direction: column;
    }
  }
</style>
