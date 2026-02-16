<svelte:head>
  <title>{data.site.name} | Historical Site</title>
</svelte:head>

<script>
  import { formatYear } from '$lib/data/sites';

  export let data;
  let activeIndex = -1;

  $: activeImage = activeIndex >= 0 ? data.images[activeIndex] : null;

  function openModal(index) {
    activeIndex = index;
  }

  function closeModal() {
    activeIndex = -1;
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
    if (activeIndex < 0) return;
    if (event.key === 'Escape') closeModal();
    if (event.key === 'ArrowRight') nextImage();
    if (event.key === 'ArrowLeft') prevImage();
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

  <header class="site-head">
    <p class="epoch">{data.site.epoch}</p>
    <h1>{data.site.name}</h1>
    <p class="meta">{data.site.region} · {data.site.yearRange}</p>
    <p class="idea">{data.site.idea}</p>
  </header>

  <section class="story-grid">
    <article class="panel">
      <h2>Origin Story</h2>
      <p>{data.site.originStory}</p>
      <p>{data.site.blurb}</p>
      <p><strong>Cultural Context:</strong> {data.site.culture}</p>
    </article>

    <article class="panel">
      <h2>Key Timeline Events</h2>
      <ol>
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
  </section>

  <section class="gallery">
    <div class="gallery-head">
      <h2>Reconstruction Gallery</h2>
      <p>{data.images.length} images · click any image to view larger</p>
    </div>

    <div class="grid">
      {#each data.images as image, index}
        <button class="card" on:click={() => openModal(index)}>
          <img
            src={`/site-media/${data.site.slug}/${image.file}`}
            alt={image.caption || `Reconstruction of ${data.site.name}`}
            loading="lazy"
          />
          <span>{image.caption}</span>
        </button>
      {/each}
    </div>
  </section>

  {#if activeImage}
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
        <button class="nav prev" on:click={prevImage} aria-label="Previous image">‹</button>
        <img
          class="lightbox-image"
          src={`/site-media/${data.site.slug}/${activeImage.file}`}
          alt={activeImage.caption || `Reconstruction of ${data.site.name}`}
        />
        <button class="nav next" on:click={nextImage} aria-label="Next image">›</button>
        <div class="caption">
          <p>{activeImage.caption}</p>
          {#if activeImage.source_url}
            <a href={activeImage.source_url} target="_blank" rel="noreferrer">Source</a>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: radial-gradient(circle at top, #faf3e5 0%, #ead8ba 55%, #dfc59f 100%);
    color: #271b0f;
    font-family: 'Fraunces', 'Cormorant Garamond', 'Palatino Linotype', serif;
  }

  .site-page {
    max-width: 1180px;
    margin: 0 auto;
    padding: 1rem;
  }

  .back-link {
    display: inline-block;
    margin-bottom: 0.8rem;
    color: #184f71;
    text-decoration: none;
    font-weight: 700;
  }

  .site-head {
    border: 1px solid #d6b180;
    border-radius: 16px;
    background: linear-gradient(135deg, #fff9ee, #f3e0bf);
    padding: 1rem;
  }

  .epoch {
    margin: 0;
    color: #8d6032;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.75rem;
    font-weight: 700;
  }

  h1 {
    margin: 0.3rem 0 0.45rem;
    font-size: clamp(1.45rem, 3.4vw, 2.4rem);
  }

  .meta,
  .idea {
    margin: 0.2rem 0 0;
    color: #5d482b;
  }

  .story-grid {
    margin-top: 0.9rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.8rem;
  }

  .panel {
    border: 1px solid #d1b083;
    border-radius: 12px;
    background: rgba(255, 251, 242, 0.93);
    padding: 0.8rem;
  }

  .panel h2 {
    margin: 0 0 0.55rem;
    font-size: 1.12rem;
  }

  .panel p {
    margin: 0.3rem 0;
    line-height: 1.45;
  }

  ol {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.5rem;
  }

  li {
    display: grid;
    grid-template-columns: 115px 1fr;
    gap: 0.5rem;
    border-left: 3px solid #b7884f;
    padding-left: 0.5rem;
  }

  .year {
    color: #734d22;
    font-weight: 700;
  }

  li p {
    margin: 0.2rem 0 0;
    color: #5d492f;
    font-size: 0.9rem;
  }

  .gallery {
    margin-top: 0.95rem;
    border: 1px solid #d7b88b;
    border-radius: 14px;
    background: rgba(255, 251, 243, 0.94);
    padding: 0.9rem;
  }

  .gallery-head h2 {
    margin: 0;
    font-size: 1.2rem;
  }

  .gallery-head p {
    margin: 0.2rem 0 0.75rem;
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
    cursor: pointer;
    color: inherit;
    transition: transform 130ms ease, box-shadow 130ms ease;
  }

  .card:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(104, 69, 21, 0.15);
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

  @media (max-width: 860px) {
    .story-grid {
      grid-template-columns: 1fr;
    }

    li {
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
