import { useEffect, useRef, useState } from "react";
import AccountDialog from "./components/AccountDialog";
import DownloadDialog from "./components/DownloadDialog";
import TerrainCanvas from "./components/TerrainCanvas";
import Icon from "./components/Icon";
import type { IconName } from "./components/Icon";
import useScrollReveal from "./hooks/useScrollReveal";
import usePromptRotation from "./hooks/usePromptRotation";

type Landscape = "alpine" | "desert" | "island";
const landscapes: {
  id: Landscape;
  name: string;
  prompt: string;
  tag: string;
}[] = [
  {
    id: "alpine",
    name: "Alpine valley",
    prompt:
      "Create an alpine valley with dramatic peaks and winding ridgelines.",
    tag: "ALPINE VALLEY",
  },
  {
    id: "desert",
    name: "Desert dunes",
    prompt: "Build an endless desert of soft dunes sculpted by the wind.",
    tag: "DESERT DUNES",
  },
  {
    id: "island",
    name: "Wild island",
    prompt:
      "Imagine a remote island with rugged mountains and untouched shores.",
    tag: "WILD ISLAND",
  },
];
const promptChoices = landscapes.map((item) => item.id);

function Brand({ light = false }: { light?: boolean }) {
  return (
    <a
      className={`brand${light ? " brand-light" : ""}`}
      href="#"
      aria-label="TERRA home"
    >
      <span className="brand-symbol">
        <Icon name="mountain" size={26} />
      </span>
      <span>
        TERRA<span className="brand-period">.</span>
      </span>
    </a>
  );
}

function App() {
  const mainRef = useRef<HTMLElement>(null);
  useScrollReveal(mainRef);
  const [accountOpen, setAccountOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [landscape, setLandscape] = useState<Landscape>("alpine");
  const [wireframe, setWireframe] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Landscape>("alpine");
  const [promptFocused, setPromptFocused] = useState(false);
  const [promptRevision, setPromptRevision] = useState(0);
  const promptRef = useRef<HTMLDivElement>(null);
  const rotation = usePromptRotation(
    promptRef,
    selectedPrompt,
    promptChoices,
    setSelectedPrompt,
    accountOpen || downloadOpen || promptFocused,
    promptRevision,
  );
  const [status, setStatus] = useState("Sample scene · Drag to look around");
  const [fullscreen, setFullscreen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const current = landscapes.find((item) => item.id === landscape)!;
  const prompt = landscapes.find((item) => item.id === selectedPrompt)!.prompt;

  useEffect(() => {
    const onFullscreenChange = () =>
      setFullscreen(document.fullscreenElement === editorRef.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function selectLandscape(id: Landscape) {
    setLandscape(id);
    selectPrompt(id);
    setStatus("Sample scene · Drag to look around");
  }

  function selectPrompt(id: Landscape) {
    setSelectedPrompt(id);
    setPromptRevision((revision) => revision + 1);
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (editorRef.current?.requestFullscreen)
        await editorRef.current.requestFullscreen();
      else setStatus("Full screen is not supported in this browser.");
    } catch {
      setStatus("Full screen is not available in this browser.");
    }
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner page-width">
          <Brand />
          <nav className="desktop-nav" aria-label="Main navigation">
            <a className="nav-active" href="#product">
              Product
            </a>
            <a href="#how-it-works">How it works</a>
            <a href="#our-vision">
              Our vision <span className="tiny-dot" />
            </a>
          </nav>
          <div className="header-actions">
            <button
              className="login-button"
              onClick={() => setAccountOpen(true)}
            >
              Log in <Icon name="arrow-up" size={15} />
            </button>
            <button
              className="button button-dark button-small"
              onClick={() => setDownloadOpen(true)}
            >
              Get TERRA <Icon name="download" size={15} />
            </button>
            <button
              className="mobile-menu-button icon-button"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <Icon name={mobileOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav
            id="mobile-navigation"
            className="mobile-navigation"
            aria-label="Mobile navigation"
          >
            {[
              ["#product", "Product"],
              ["#how-it-works", "How it works"],
              ["#our-vision", "Our vision"],
            ].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileOpen(false)}>
                {label}
                <Icon name="arrow-up" size={16} />
              </a>
            ))}
            <button
              onClick={() => {
                setMobileOpen(false);
                setAccountOpen(true);
              }}
            >
              Log in
              <Icon name="arrow-up" size={16} />
            </button>
          </nav>
        )}
      </header>

      <main id="main" ref={mainRef}>
        <section
          id="product"
          className="hero page-width"
          aria-labelledby="hero-heading"
        >
          <div className="hero-copy">
            <div className="hero-heading" data-reveal="up">
              <div className="eyebrow">
                <span className="status-dot" /> YOUR IMAGINATION. A NEW
                DIMENSION.
              </div>
              <h1 id="hero-heading">
                A world of
                <br />
                <em>your own.</em>
                <span className="headline-star" aria-hidden="true">
                  ✳
                </span>
              </h1>
            </div>
            <div className="hero-intro" data-reveal="up" data-reveal-delay="1">
              <p>
                From a spark of an idea to an entire landscape.
                <br className="desktop-break" /> Create, shape, and explore 3D
                worlds with AI.
                <br className="desktop-break" /> A little less complexity. A lot
                more possibility.
              </p>
              <div className="hero-actions">
                <button
                  className="button button-dark"
                  onClick={() => setDownloadOpen(true)}
                >
                  Start creating <Icon name="arrow" size={18} />
                </button>
                <a className="text-link" href="#how-it-works">
                  See how it works <Icon name="play" size={14} />
                </a>
              </div>
              <div className="platform-note">
                <span className="platform-icons">
                  <Icon name="windows" size={13} />
                  <Icon name="apple" size={14} />
                  <Icon name="linux" size={15} />
                </span>
                <span>Your next creative space. Coming to desktop.</span>
              </div>
            </div>
          </div>

          <div className="editor-frame" ref={editorRef} data-reveal="up">
            <div className="editor-topbar">
              <div className="editor-file">
                <span className="editor-mini-logo">
                  <Icon name="mountain" size={17} />
                </span>
                <span>
                  My first world<span className="file-extension">.terra</span>
                </span>
                <span className="file-divider" />
                <span className="preview-label">
                  <span /> Preview only
                </span>
              </div>
              <span className="editor-app-name">TERRA STUDIO</span>
              <button
                className="editor-icon-button"
                aria-label={fullscreen ? "Exit full screen" : "Expand preview"}
                title={fullscreen ? "Exit full screen" : "Expand preview"}
                onClick={toggleFullscreen}
              >
                <Icon name={fullscreen ? "close" : "expand"} size={15} />
              </button>
            </div>
            <div className="editor-body">
              <aside className="editor-sidebar" aria-label="Landscape presets">
                <div className="sidebar-heading">
                  YOUR WORLD
                  <Icon name="layers" size={13} />
                </div>
                <div className="scene-item">
                  <Icon name="mountain" size={15} />
                  <span>Landscape</span>
                  <span className="scene-dot" />
                </div>
                <div className="scene-item scene-muted">
                  <Icon name="sun" size={15} />
                  <span>Natural light</span>
                </div>
                <div className="scene-item scene-muted">
                  <Icon name="camera" size={15} />
                  <span>Perspective camera</span>
                </div>
                <div className="sidebar-divider" />
                <div className="sidebar-heading">SAMPLE SCENES</div>
                <div className="landscape-presets">
                  {landscapes.map((item, index) => (
                    <button
                      key={item.id}
                      className={`landscape-preset${landscape === item.id ? " is-active" : ""}`}
                      onClick={() => selectLandscape(item.id)}
                      aria-pressed={landscape === item.id}
                    >
                      <span
                        className={`preset-thumb preset-${item.id}`}
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 80 46">
                          <path
                            d={
                              index === 0
                                ? "M0 46 14 22 23 30 40 5 53 26 63 19 80 46Z"
                                : index === 1
                                  ? "M0 38Q22 5 42 30Q62 2 80 31V46H0Z"
                                  : "M0 46 20 38 34 15 45 23 54 8 66 37 80 46Z"
                            }
                          />
                          <path
                            d={
                              index === 1
                                ? "M0 43Q28 15 55 39T80 38"
                                : "m15 46 25-27 8 18 15-8 17 17"
                            }
                          />
                        </svg>
                      </span>
                      <span>{item.name}</span>
                      {landscape === item.id && <Icon name="check" size={12} />}
                    </button>
                  ))}
                </div>
                <div className="sidebar-bottom">
                  <span className="sidebar-bottom-icon">
                    <Icon name="sparkles" size={15} />
                  </span>
                  <span>
                    A blank canvas.
                    <br />
                    <strong>Infinite possibilities.</strong>
                  </span>
                </div>
              </aside>
              <div className="editor-viewport">
                <div className="terrain-stage">
                  <TerrainCanvas variant={landscape} wireframe={wireframe} />
                </div>
                <div className="viewport-topline">
                  <span>
                    <span className="live-dot" />
                    PERSPECTIVE
                  </span>
                  <span className="viewport-shading">
                    {wireframe ? "WIREFRAME" : "SHADED"}
                    <span className="viewport-short-divider" />
                    3D
                  </span>
                </div>
                <div className="viewport-tools">
                  <button
                    className={`viewport-tool${!wireframe ? " is-active" : ""}`}
                    onClick={() => setWireframe(false)}
                    aria-label="Shaded view"
                    aria-pressed={!wireframe}
                    title="Shaded view"
                  >
                    <Icon name="box" size={17} />
                  </button>
                  <button
                    className={`viewport-tool${wireframe ? " is-active" : ""}`}
                    onClick={() => setWireframe(true)}
                    aria-label="Wireframe view"
                    aria-pressed={wireframe}
                    title="Wireframe view"
                  >
                    <Icon name="grid" size={17} />
                  </button>
                </div>
                <div className="landscape-coordinate">
                  <span>01 / {current.tag}</span>
                  <span>BUILT FROM A LITTLE IMAGINATION</span>
                </div>
                <div className="axis-gizmo" aria-hidden="true">
                  <span className="axis-y">Y</span>
                  <span className="axis-z">Z</span>
                  <span className="axis-x">X</span>
                  <i />
                  <i />
                  <i />
                </div>
                <div className="prompt-composer" ref={promptRef}>
                  <div className="prompt-composer-heading">
                    <label htmlFor="world-prompt">
                      <Icon name="sparkles" size={19} /> Imagine the
                      possibilities
                    </label>
                    <div className="prompt-rotation-controls">
                      <span className="prompt-counter" aria-hidden="true">
                        {String(
                          promptChoices.indexOf(selectedPrompt) + 1,
                        ).padStart(2, "0")}{" "}
                        / 03
                      </span>
                      {!rotation.reducedMotion && (
                        <button
                          type="button"
                          className="prompt-rotation-toggle"
                          aria-label={
                            rotation.paused
                              ? "Resume example rotation"
                              : "Pause example rotation"
                          }
                          onClick={() => rotation.setPaused(!rotation.paused)}
                        >
                          {rotation.paused ? (
                            <Icon name="play" size={12} />
                          ) : (
                            <span className="pause-symbol" aria-hidden="true">
                              Ⅱ
                            </span>
                          )}
                          <span>{rotation.paused ? "Play" : "Pause"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="prompt-example-row">
                    <textarea
                      key={selectedPrompt}
                      className={`rotating-prompt${rotation.leaving ? " is-leaving" : ""}`}
                      id="world-prompt"
                      aria-label="Example prompt"
                      aria-describedby="prompt-install-note"
                      value={prompt}
                      readOnly
                      rows={2}
                      onFocus={() => setPromptFocused(true)}
                      onBlur={() => setPromptFocused(false)}
                    />
                    <button
                      className="button button-dark prompt-install-button"
                      type="button"
                      onClick={() => setDownloadOpen(true)}
                    >
                      <span>Get the app</span>
                      <Icon name="download" size={18} />
                    </button>
                  </div>
                  <div
                    className="prompt-suggestions"
                    role="group"
                    aria-label="Choose an example prompt"
                  >
                    {landscapes.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`prompt-suggestion${selectedPrompt === item.id ? " is-selected" : ""}`}
                        aria-pressed={selectedPrompt === item.id}
                        onClick={() => selectPrompt(item.id)}
                      >
                        <Icon name="sparkles" size={13} />
                        {item.name}
                      </button>
                    ))}
                  </div>
                  <p id="prompt-install-note">
                    Examples only. Install TERRA to send prompts and create
                    worlds.
                  </p>
                </div>
              </div>
            </div>
            <div className="editor-statusbar">
              <span className="editor-status" role="status">
                <span className="ready-dot" />
                {status}
              </span>
              <span className="preview-disclaimer">
                Creation is available in the desktop app only
              </span>
              <span className="statusbar-version">
                A LITTLE PREVIEW OF WHAT’S NEXT{" "}
                <Icon name="sparkles" size={10} />
              </span>
            </div>
          </div>
          <div className="under-preview" data-reveal="up">
            <span>
              <span className="small-sparkle">✳</span> A new starting point for
              world builders.
            </span>
            <span>Big landscapes. Small learning curve.</span>
          </div>
        </section>

        <section
          className="features-section page-width"
          id="how-it-works"
          aria-labelledby="features-heading"
        >
          <div className="section-top">
            <div data-reveal="up">
              <div className="eyebrow muted-eyebrow">
                MADE FOR THE WAY YOU THINK
              </div>
              <h2 id="features-heading">
                Less in your way.
                <br />
                <span>More in your world.</span>
              </h2>
            </div>
            <p data-reveal="up" data-reveal-delay="1">
              You bring the idea. TERRA brings the tools.
              <br />A simpler path from “what if” to “look at this.”
            </p>
          </div>
          <div className="features-grid">
            <Feature
              number="01"
              icon="sparkles"
              title="Start with a sentence."
              description="A mountain range. A quiet island. Somewhere that doesn’t exist yet. Just describe what you have in mind."
            />
            <Feature
              number="02"
              icon="sliders"
              title="Make it feel like you."
              description="Shape the terrain, find the right light, and explore the details. Your creative direction stays at the center."
            />
            <Feature
              number="03"
              icon="box"
              title="Think beyond the canvas."
              description="Build a world for your next game, a story you want to tell, or simply the joy of making something new."
            />
          </div>
        </section>

        <section
          className="vision-section page-width"
          id="our-vision"
          aria-labelledby="vision-heading"
        >
          <div className="vision-art" aria-hidden="true" data-reveal="left">
            <div className="contour contour-1" />
            <div className="contour contour-2" />
            <div className="contour contour-3" />
            <div className="contour contour-4" />
            <div className="contour contour-5" />
            <div className="contour contour-6" />
            <span className="vision-cross cross-one">+</span>
            <span className="vision-cross cross-two">+</span>
            <span className="vision-art-label">ROOM FOR THE UNIMAGINED.</span>
          </div>
          <div
            className="vision-copy"
            data-reveal="right"
            data-reveal-delay="1"
          >
            <div className="eyebrow muted-eyebrow">
              A SMALL TEAM. A BIG IDEA.
            </div>
            <h2 id="vision-heading">
              World building should
              <br />
              be for <em>everyone.</em>
            </h2>
            <p>
              We’re a group of friends building the creative tool we wish we
              had. A place where AI makes the first step easier, and your
              imagination takes it from there.
            </p>
            <p>We’re just getting started. There’s a whole world ahead.</p>
            <button className="text-link" onClick={() => setDownloadOpen(true)}>
              Be part of what comes next <Icon name="arrow-up" size={16} />
            </button>
          </div>
        </section>

        <section
          className="cta-section page-width"
          aria-labelledby="cta-heading"
          data-reveal="up"
        >
          <div>
            <div className="eyebrow muted-eyebrow">
              YOUR NEXT CHAPTER STARTS HERE
            </div>
            <h2 id="cta-heading">
              What will <em>you</em> create?
            </h2>
          </div>
          <button
            className="button button-dark"
            onClick={() => setDownloadOpen(true)}
          >
            Get TERRA <Icon name="download" size={18} />
          </button>
        </section>
      </main>

      <footer className="site-footer page-width">
        <div className="footer-brand-row">
          <Brand />
          <span>A little imagination goes a long way.</span>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} TERRA. A world in the making.
          </span>
          <nav aria-label="Footer navigation">
            <a href="#product">Product</a>
            <a href="#our-vision">Our story</a>
            <button onClick={() => setAccountOpen(true)}>
              Account <Icon name="arrow-up" size={12} />
            </button>
          </nav>
          <span className="footer-made">
            <span className="status-dot" />
            Made for the curious.
          </span>
        </div>
      </footer>
      <AccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} />
      <DownloadDialog
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
      />
    </>
  );
}

function Feature({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <article
      className="feature"
      data-reveal="up"
      data-reveal-delay={String(Number(number) - 1)}
    >
      <div className="feature-top">
        <span className="feature-icon">
          <Icon name={icon} size={23} />
        </span>
        <span className="feature-number">/ {number}</span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

export default App;
