<svelte:head>
  <title>{data.site.name} | Developer Notes</title>
</svelte:head>

<script>
  import { formatYear } from '$lib/data/sites';

  export let data;
  let activeIndex = -1;
  let activeStandalone = null;

  $: activeImage = activeIndex >= 0 ? data.images[activeIndex] : null;
  $: activeModal =
    activeStandalone ??
    (activeImage
      ? {
          src: `/site-media/${data.site.slug}/${activeImage.file}`,
          alt: activeImage.caption || `Reconstruction of ${data.site.name}`,
          caption: activeImage.caption || `Reconstruction of ${data.site.name}`,
          sourceUrl: activeImage.source_url || null
        }
      : null);
  $: officialPhotos = data.visualPack?.officialPhotos ?? [];
  $: officialIllustrations = data.visualPack?.officialIllustrations ?? [];
  $: createdIllustrations = data.visualPack?.createdIllustrations ?? [];
  $: materialReferences = data.referenceVisuals?.materials ?? [];
  $: toolReferences = data.referenceVisuals?.tools ?? [];

  function openModal(index) {
    activeStandalone = null;
    activeIndex = index;
  }

  function openImagePreview({ src, alt, caption, sourceUrl }) {
    activeIndex = -1;
    activeStandalone = {
      src,
      alt: alt || caption || 'Historical site image',
      caption: caption || alt || 'Historical site image',
      sourceUrl: sourceUrl || null
    };
  }

  function closeModal() {
    activeIndex = -1;
    activeStandalone = null;
  }

  function nextImage() {
    if (!data.images.length) return;
    activeIndex = (activeIndex + 1) % data.images.length;
  }

  function prevImage() {
    if (!data.images.length) return;
    activeIndex = (activeIndex - 1 + data.images.length) % data.images.length;
  }

  function onKeydown(event) {
    if (!activeModal) return;
    if (event.key === 'Escape') closeModal();
    if (!activeStandalone && event.key === 'ArrowRight') nextImage();
    if (!activeStandalone && event.key === 'ArrowLeft') prevImage();
  }

  function onOverlayKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      closeModal();
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<main class="site-page">
  <a class="back-link" href="/sites">← Back to timeline</a>

  <header class="hero">
    <div class="hero-main">
      <p class="eyebrow">Site dossier</p>
      <h1>{data.site.name}</h1>
      <p class="meta">{data.site.region} · {data.site.epoch} · {data.site.yearRange}</p>
      <p class="idea">{data.site.idea}</p>
      <p class="summary">{data.site.blurb}</p>
    </div>
    <div class="hero-side">
      <article>
        <h2>Provenance Key</h2>
        <p><span class="badge official">Official Source</span> from Wikipedia / Wikimedia Commons with source links.</p>
        <p><span class="badge created">Created Illustration</span> generated in-project for teaching comparison.</p>
      </article>
      <article>
        <h2>Coverage</h2>
        <p>{data.images.length} reconstruction gallery images</p>
        <p>{officialPhotos.length + officialIllustrations.length} official visuals</p>
        <p>{createdIllustrations.length} created visuals</p>
      </article>
    </div>
  </header>

  <section class="info-grid">
    <article class="panel">
      <h2>Origin Story</h2>
      <p>{data.site.originStory}</p>
      <p><strong>Cultural context:</strong> {data.site.culture}</p>
    </article>

    <article class="panel">
      <h2>Famous Timeline Events</h2>
      <ol class="timeline-list">
        {#each data.events as event}
          <li>
            <span class="year">{formatYear(event.year)}</span>
            <div>
              <strong>{event.title}</strong>
              <p>{event.text}</p>
            </div>
          </li>
        {/each}
      </ol>
    </article>

    <article class="panel">
      <h2>Construction Summary</h2>
      {#if data.construction?.constructionMethods?.length}
        <p class="mini-head">Methods</p>
        <ul class="bullet-list">
          {#each data.construction.constructionMethods as method}
            <li>{method}</li>
          {/each}
        </ul>
      {/if}
      {#if data.construction?.materials?.length}
        <p class="mini-head">Materials</p>
        <ul class="bullet-list">
          {#each data.construction.materials as material}
            <li>{material}</li>
          {/each}
        </ul>
      {/if}
      {#if data.construction?.constructionTools?.length}
        <p class="mini-head">Likely tools</p>
        <ul class="bullet-list">
          {#each data.construction.constructionTools as tool}
            <li>{tool}</li>
          {/each}
        </ul>
      {/if}
      {#if data.construction?.notes}
        <p class="small-note">{data.construction.notes}</p>
      {/if}
    </article>
  </section>

  <section class="visual-section">
    <div class="section-head">
      <h2>Official Pictures and Illustrations</h2>
      <p>All cards below include source links and license text.</p>
    </div>

    <div class="visual-grid">
      {#each officialPhotos as media}
        <article class="visual-card">
          <div class="visual-top">
            <span class="badge official">Official Source</span>
            <span class="kind">Photo</span>
          </div>
          <button
            class="media-button"
            on:click={() =>
              openImagePreview({
                src: media.imageUrl,
                alt: media.title,
                caption: media.title,
                sourceUrl: media.sourceUrl
              })}
            aria-label={`Open ${media.title} fullscreen`}
          >
            <img src={media.imageUrl} alt={media.title} loading="lazy" />
          </button>
          <h3>{media.title}</h3>
          <p class="meta-line">{media.sourceName} · {media.license}</p>
          {#if media.author}
            <p class="meta-line">Author: {media.author}</p>
          {/if}
          {#if media.sourceUrl}
            <a class="source-link" href={media.sourceUrl} target="_blank" rel="noreferrer">Open official source</a>
          {/if}
        </article>
      {/each}

      {#each officialIllustrations as media}
        <article class="visual-card">
          <div class="visual-top">
            <span class="badge official">Official Source</span>
            <span class="kind">Illustration</span>
          </div>
          <button
            class="media-button"
            on:click={() =>
              openImagePreview({
                src: media.imageUrl,
                alt: media.title,
                caption: media.title,
                sourceUrl: media.sourceUrl
              })}
            aria-label={`Open ${media.title} fullscreen`}
          >
            <img src={media.imageUrl} alt={media.title} loading="lazy" />
          </button>
          <h3>{media.title}</h3>
          <p class="meta-line">{media.sourceName} · {media.license}</p>
          {#if media.author}
            <p class="meta-line">Author: {media.author}</p>
          {/if}
          {#if media.sourceUrl}
            <a class="source-link" href={media.sourceUrl} target="_blank" rel="noreferrer">Open official source</a>
          {/if}
        </article>
      {/each}
    </div>
  </section>

  <section class="visual-section">
    <div class="section-head">
      <h2>Created Illustrations</h2>
      <p>These were created in-project for educational explanation and are not archaeological originals.</p>
    </div>

    <div class="visual-grid">
      {#each createdIllustrations as media}
        <article class="visual-card">
          <div class="visual-top">
            <span class="badge created">Created Illustration</span>
            <span class="kind">Project</span>
          </div>
          <button
            class="media-button"
            on:click={() =>
              openImagePreview({
                src: media.imageUrl,
                alt: media.title,
                caption: media.title,
                sourceUrl: media.sourceUrl
              })}
            aria-label={`Open ${media.title} fullscreen`}
          >
            <img src={media.imageUrl} alt={media.title} loading="lazy" />
          </button>
          <h3>{media.title}</h3>
          {#if media.description}
            <p class="meta-line">{media.description}</p>
          {/if}
          <p class="meta-line">{media.sourceName} · {media.license}</p>
        </article>
      {/each}
    </div>
  </section>

  <section class="visual-section">
    <div class="section-head">
      <h2>Building Materials Reference</h2>
      <p>Each material shows an official reference image and a created comparison illustration.</p>
    </div>

    <div class="reference-grid">
      {#each materialReferences as material}
        <article class="reference-card">
          <h3>{material.label}</h3>
          <div class="split">
            <article class="mini-card">
              <p class="mini-headline"><span class="badge official">Official Source</span></p>
              {#if material.official}
                <button
                  class="media-button"
                  on:click={() =>
                    openImagePreview({
                      src: material.official.imageUrl,
                      alt: material.official.title,
                      caption: material.official.title,
                      sourceUrl: material.official.sourceUrl
                    })}
                  aria-label={`Open ${material.official.title} fullscreen`}
                >
                  <img src={material.official.imageUrl} alt={material.official.title} loading="lazy" />
                </button>
                <p>{material.official.title}</p>
                <p class="meta-line">{material.official.license}</p>
                <a class="source-link" href={material.official.sourceUrl} target="_blank" rel="noreferrer">Source</a>
              {:else}
                <p>Official image unavailable.</p>
              {/if}
            </article>

            <article class="mini-card">
              <p class="mini-headline"><span class="badge created">Created Illustration</span></p>
              <button
                class="media-button"
                on:click={() =>
                  openImagePreview({
                    src: material.created.imageUrl,
                    alt: material.created.title,
                    caption: material.created.title,
                    sourceUrl: material.created.sourceUrl
                  })}
                aria-label={`Open ${material.created.title} fullscreen`}
              >
                <img src={material.created.imageUrl} alt={material.created.title} loading="lazy" />
              </button>
              <p>{material.created.title}</p>
            </article>
          </div>
        </article>
      {/each}
    </div>
  </section>

  <section class="visual-section">
    <div class="section-head">
      <h2>Construction Tools Reference</h2>
      <p>Official tool visuals are paired with created visuals for classroom comparison.</p>
    </div>

    <div class="reference-grid">
      {#each toolReferences as tool}
        <article class="reference-card">
          <h3>{tool.label}</h3>
          <div class="split">
            <article class="mini-card">
              <p class="mini-headline"><span class="badge official">Official Source</span></p>
              {#if tool.official}
                <button
                  class="media-button"
                  on:click={() =>
                    openImagePreview({
                      src: tool.official.imageUrl,
                      alt: tool.official.title,
                      caption: tool.official.title,
                      sourceUrl: tool.official.sourceUrl
                    })}
                  aria-label={`Open ${tool.official.title} fullscreen`}
                >
                  <img src={tool.official.imageUrl} alt={tool.official.title} loading="lazy" />
                </button>
                <p>{tool.official.title}</p>
                <p class="meta-line">{tool.official.license}</p>
                <a class="source-link" href={tool.official.sourceUrl} target="_blank" rel="noreferrer">Source</a>
              {:else}
                <p>Official image unavailable.</p>
              {/if}
            </article>

            <article class="mini-card">
              <p class="mini-headline"><span class="badge created">Created Illustration</span></p>
              <button
                class="media-button"
                on:click={() =>
                  openImagePreview({
                    src: tool.created.imageUrl,
                    alt: tool.created.title,
                    caption: tool.created.title,
                    sourceUrl: tool.created.sourceUrl
                  })}
                aria-label={`Open ${tool.created.title} fullscreen`}
              >
                <img src={tool.created.imageUrl} alt={tool.created.title} loading="lazy" />
              </button>
              <p>{tool.created.title}</p>
            </article>
          </div>
        </article>
      {/each}
    </div>
  </section>

  <section class="sources panel">
    <h2>Construction Data Sources</h2>
    {#if data.construction?.sources?.length}
      <ul class="source-list">
        {#each data.construction.sources as source}
          <li>
            <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
          </li>
        {/each}
      </ul>
    {:else}
      <p>Source links will be added during curation updates.</p>
    {/if}
    {#if data.construction?.lastUpdated}
      <p class="small-note">Construction profile updated: {data.construction.lastUpdated}</p>
    {/if}
  </section>

  <section class="gallery">
    <div class="gallery-head">
      <h2>Reconstruction Gallery</h2>
      <p>{data.images.length} items · click to open full view</p>
    </div>

    <div class="grid">
      {#each data.images as image, index}
        <article class="card">
          <button class="thumb-button" on:click={() => openModal(index)}>
            <img
              src={`/site-media/${data.site.slug}/${image.file}`}
              alt={image.caption || `Reconstruction of ${data.site.name}`}
              loading="lazy"
            />
          </button>
          <span>{image.caption}</span>
          <a class="image-source-link" href={image.source_url} target="_blank" rel="noreferrer">Image source</a>
        </article>
      {/each}
    </div>
  </section>

  {#if activeModal}
    <div
      class="lightbox"
      role="button"
      tabindex="0"
      aria-label="Close image viewer"
      on:click|self={closeModal}
      on:keydown={onOverlayKeydown}
    >
      <div class="lightbox-inner">
        <button class="close" on:click={closeModal} aria-label="Close">×</button>
        {#if !activeStandalone}
          <button class="nav prev" on:click={prevImage} aria-label="Previous image">‹</button>
        {/if}
        <img
          class="lightbox-image"
          src={activeModal.src}
          alt={activeModal.alt}
        />
        {#if !activeStandalone}
          <button class="nav next" on:click={nextImage} aria-label="Next image">›</button>
        {/if}
        <div class="caption">
          <p>{activeModal.caption}</p>
          {#if activeModal.sourceUrl}
            <a href={activeModal.sourceUrl} target="_blank" rel="noreferrer">Source</a>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    color: #1f1a14;
    background:
      radial-gradient(circle at 12% 14%, rgba(255, 225, 176, 0.38), transparent 28%),
      radial-gradient(circle at 88% 11%, rgba(146, 198, 239, 0.28), transparent 26%),
      linear-gradient(150deg, #f5efe3 0%, #eadbc1 52%, #e0c9a5 100%);
    font-family: 'Fraunces', 'Cormorant Garamond', 'Palatino Linotype', serif;
  }

  .site-page {
    max-width: 1220px;
    margin: 0 auto;
    padding: 1rem;
  }

  .back-link {
    display: inline-block;
    margin-bottom: 0.8rem;
    color: #154e71;
    text-decoration: none;
    font-weight: 700;
  }

  .hero {
    display: grid;
    grid-template-columns: 1.45fr 1fr;
    gap: 0.85rem;
    border: 1px solid #c9b28c;
    border-radius: 18px;
    background: linear-gradient(145deg, rgba(255, 250, 241, 0.96), rgba(246, 232, 205, 0.92));
    box-shadow: 0 14px 30px rgba(63, 43, 11, 0.14);
    padding: 1rem;
  }

  .hero-main {
    padding-right: 0.2rem;
  }

  .eyebrow {
    margin: 0;
    font-size: 0.74rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6d573a;
    font-weight: 700;
  }

  h1 {
    margin: 0.25rem 0 0.5rem;
    font-size: clamp(1.45rem, 3.2vw, 2.45rem);
    line-height: 1.12;
  }

  .meta,
  .idea,
  .summary {
    margin: 0.24rem 0;
    color: #4f4029;
  }

  .hero-side {
    display: grid;
    gap: 0.7rem;
  }

  .hero-side article {
    border: 1px solid #d2ba93;
    border-radius: 12px;
    background: rgba(255, 252, 246, 0.86);
    padding: 0.7rem;
  }

  .hero-side h2 {
    margin: 0 0 0.4rem;
    font-size: 1rem;
  }

  .hero-side p {
    margin: 0.35rem 0;
    font-size: 0.9rem;
    line-height: 1.35;
    color: #4f4029;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.16rem 0.45rem;
    border-radius: 999px;
    font-size: 0.73rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .official {
    background: #d7ebff;
    color: #0c4468;
    border: 1px solid #9ac5e8;
  }

  .created {
    background: #ffe5c7;
    color: #7a3f0a;
    border: 1px solid #e3aa6c;
  }

  .info-grid {
    margin-top: 0.9rem;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.8rem;
  }

  .panel {
    border: 1px solid #ccb18a;
    border-radius: 14px;
    background: rgba(255, 251, 245, 0.94);
    padding: 0.85rem;
  }

  .panel h2 {
    margin: 0 0 0.55rem;
    font-size: 1.11rem;
  }

  .panel p {
    margin: 0.32rem 0;
    line-height: 1.42;
  }

  .timeline-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.48rem;
  }

  .timeline-list li {
    display: grid;
    grid-template-columns: 118px 1fr;
    gap: 0.55rem;
    border-left: 3px solid #b4844d;
    padding-left: 0.5rem;
  }

  .timeline-list .year {
    color: #6f4f29;
    font-weight: 700;
  }

  .timeline-list li p {
    margin: 0.16rem 0 0;
    color: #5a4a33;
    font-size: 0.9rem;
  }

  .mini-head {
    margin-top: 0.52rem;
    margin-bottom: 0.24rem;
    font-weight: 700;
    color: #4b391f;
  }

  .bullet-list {
    margin: 0;
    padding-left: 1.05rem;
  }

  .bullet-list li {
    margin: 0.18rem 0;
  }

  .small-note {
    margin-top: 0.45rem;
    color: #5a4b31;
    font-size: 0.84rem;
  }

  .visual-section {
    margin-top: 0.95rem;
    border: 1px solid #cdb289;
    border-radius: 14px;
    background: rgba(255, 251, 245, 0.94);
    padding: 0.85rem;
  }

  .section-head h2 {
    margin: 0;
    font-size: 1.2rem;
  }

  .section-head p {
    margin: 0.2rem 0 0.75rem;
    color: #604b2d;
  }

  .visual-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 0.72rem;
  }

  .visual-card {
    border: 1px solid #d3ba96;
    border-radius: 12px;
    background: #fffaf0;
    padding: 0.55rem;
    display: grid;
    gap: 0.42rem;
  }

  .visual-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .kind {
    color: #6e573a;
    font-size: 0.76rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .visual-card img,
  .mini-card img {
    width: auto;
    max-width: 100%;
    height: auto;
    max-height: 280px;
    object-fit: contain;
    display: block;
    margin: 0 auto;
    border-radius: 8px;
    background: #f4e6cf;
  }

  .visual-card h3,
  .reference-card h3 {
    margin: 0;
    font-size: 0.96rem;
    line-height: 1.28;
  }

  .meta-line {
    margin: 0;
    color: #5b4a31;
    font-size: 0.82rem;
  }

  .source-link {
    color: #1a5b7c;
    text-decoration: none;
    border-bottom: 1px solid rgba(26, 91, 124, 0.4);
    width: fit-content;
  }

  .source-link:hover {
    border-bottom-color: rgba(26, 91, 124, 0.85);
  }

  .reference-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 0.7rem;
  }

  .reference-card {
    border: 1px solid #d3ba96;
    border-radius: 12px;
    background: #fffaf0;
    padding: 0.58rem;
    display: grid;
    gap: 0.45rem;
  }

  .split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.55rem;
  }

  .mini-card {
    border: 1px solid #dec7a6;
    border-radius: 10px;
    background: #fffcf6;
    padding: 0.48rem;
    display: grid;
    gap: 0.34rem;
    align-content: start;
  }

  .mini-card p {
    margin: 0;
    color: #5a492f;
    font-size: 0.82rem;
    line-height: 1.34;
  }

  .mini-headline {
    margin: 0;
  }

  .sources {
    margin-top: 0.95rem;
  }

  .source-list {
    margin: 0;
    padding-left: 1.1rem;
  }

  .source-list li {
    margin: 0.22rem 0;
  }

  .gallery {
    margin-top: 0.95rem;
    border: 1px solid #ccb18a;
    border-radius: 14px;
    background: rgba(255, 251, 245, 0.94);
    padding: 0.88rem;
  }

  .gallery-head h2 {
    margin: 0;
    font-size: 1.2rem;
  }

  .gallery-head p {
    margin: 0.2rem 0 0.7rem;
    color: #624a2d;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 0.7rem;
  }

  .card {
    text-align: left;
    border: 1px solid #d8bc96;
    border-radius: 10px;
    background: #fff9ee;
    padding: 0.45rem;
    color: inherit;
    transition: transform 130ms ease, box-shadow 130ms ease;
  }

  .card:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(104, 69, 21, 0.15);
  }

  .thumb-button {
    display: block;
    width: 100%;
    border: 0;
    background: transparent;
    padding: 0;
    cursor: pointer;
  }

  .media-button {
    display: block;
    width: 100%;
    border: 0;
    background: transparent;
    padding: 0;
    cursor: zoom-in;
  }

  .card img {
    width: auto;
    max-width: 100%;
    height: auto;
    max-height: 260px;
    object-fit: contain;
    display: block;
    margin: 0 auto;
    border-radius: 6px;
    background: #f4e6cf;
  }

  .card span {
    display: block;
    margin-top: 0.4rem;
    font-size: 0.8rem;
    line-height: 1.32;
    color: #553f24;
  }

  .image-source-link {
    display: inline-block;
    margin-top: 0.35rem;
    color: #1a5b7c;
    font-size: 0.78rem;
    text-decoration: none;
    border-bottom: 1px solid rgba(26, 91, 124, 0.35);
  }

  .image-source-link:hover {
    border-bottom-color: rgba(26, 91, 124, 0.8);
  }

  .lightbox {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(20, 13, 7, 0.82);
    display: grid;
    place-items: center;
    padding: 1rem;
  }

  .lightbox-inner {
    position: relative;
    width: min(95vw, 1120px);
    max-height: 92vh;
    background: #20150b;
    border: 1px solid #7f6238;
    border-radius: 12px;
    padding: 2.3rem 2.4rem 1rem;
    display: grid;
    gap: 0.6rem;
    justify-items: center;
  }

  .lightbox-image {
    max-width: 100%;
    max-height: calc(92vh - 150px);
    width: auto;
    height: auto;
    object-fit: contain;
    display: block;
  }

  .close {
    position: absolute;
    top: 0.35rem;
    right: 0.55rem;
    background: transparent;
    border: 0;
    color: #f3e4c5;
    font-size: 2rem;
    line-height: 1;
    cursor: pointer;
  }

  .nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    border: 1px solid #a77b46;
    background: rgba(39, 26, 13, 0.8);
    color: #f8ecd4;
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 999px;
    cursor: pointer;
    font-size: 1.45rem;
    line-height: 1;
  }

  .prev {
    left: 0.55rem;
  }

  .next {
    right: 0.55rem;
  }

  .caption {
    width: 100%;
    color: #f4e9d1;
    font-size: 0.9rem;
  }

  .caption p {
    margin: 0;
  }

  .caption a {
    margin-top: 0.35rem;
    display: inline-block;
    color: #88d2ff;
  }

  @media (max-width: 980px) {
    .hero {
      grid-template-columns: 1fr;
    }

    .info-grid {
      grid-template-columns: 1fr;
    }

    .reference-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 740px) {
    .split {
      grid-template-columns: 1fr;
    }

    .timeline-list li {
      grid-template-columns: 1fr;
      gap: 0.2rem;
    }
  }

  @media (max-width: 560px) {
    .lightbox-inner {
      padding: 2rem 0.7rem 0.9rem;
    }

    .nav {
      width: 2rem;
      height: 2rem;
      font-size: 1.2rem;
    }
  }
</style>
