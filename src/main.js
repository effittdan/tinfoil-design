import "./style.css";
import {
  createIcons,
  Menu,
  X,
  ShoppingBag,
  ArrowRight,
  Search,
  Minus,
  Plus,
  ZoomIn,
  ArrowLeft,
  ChevronDown,
  Shirt,
  Radio,
  Eye,
  Check,
  Mail,
} from "lucide";
import rawCatalog from "../data/catalog.json";
import {
  collections,
  manifesto,
  story,
  articles,
  productCopy,
} from "./content.js";
import { readCart, addLine } from "./cart.js";
const iconSet = {
  Menu,
  X,
  ShoppingBag,
  ArrowRight,
  Search,
  Minus,
  Plus,
  ZoomIn,
  ArrowLeft,
  ChevronDown,
  Shirt,
  Radio,
  Eye,
  Check,
  Mail,
};
let catalog = rawCatalog.map((p) => ({
  ...p,
  description:
    p.description ||
    "A wearable transmission from the margins. For the beautifully unconvinced.",
  variants: [],
}));
let cart = readCart(),
  search = "",
  filter = new URLSearchParams(location.search).get("collection") || "all",
  sort = "featured",
  menu = false;
let capabilities = {
    enabled: false,
    stripe: false,
    paypal: false,
    countries: ["US"],
  },
  live = false;
const $ = (s) => document.querySelector(s),
  escape = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const money = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );
const icon = (name, cls = "") =>
  `<i data-lucide="${name}" class="${cls}" aria-hidden="true"></i>`;
const link = (href, text, cls = "button") =>
  `<a class="${cls}" href="${href}">${text}${icon("arrow-right")}</a>`;
const price = (p) =>
  p.variants?.length ? Math.min(...p.variants.map((v) => v.price)) : p.price;
function image(
  p,
  view = "photo",
  color = p.defaultColor || (p.id === "abduction-protocol" ? "Ivory" : "Black"),
) {
  const variant = p.variants?.find((v) => v.color === color) || p.variants?.[0];
  if (view === "photo" && variant?.image?.startsWith("https://"))
    return variant.image;
  return view === "photo" && p.feature
    ? `/assets/products/${p.id}.webp`
    : `/assets/artwork/${p.id}-${color === "Ivory" ? "light" : "dark"}.webp`;
}
function linePrice(line) {
  const p = catalog.find((p) => p.id === line.id);
  return (
    p?.variants.find((v) => v.color === line.color && v.size === line.size)
      ?.price ??
    p?.price ??
    0
  );
}
function card(p) {
  return `<article class="product-card"><a class="product-image ${p.feature ? "" : p.prepped ? "art-only light-art" : "art-only"}" href="/product/${p.id}"><img src="${image(p)}" alt="${escape(p.name)}" loading="lazy" width="800" height="800"><span class="edition">${escape(p.collection)}</span></a><div class="product-caption"><div><a href="/product/${p.id}"><h3>${escape(p.name)}</h3></a><span>${money(price(p))}${p.variants.length ? "" : " / preview"}</span></div><a href="/product/${p.id}" class="icon-link" aria-label="View ${escape(p.name)}">${icon("arrow-right")}</a></div></article>`;
}
function signup() {
  return `<section class="frequency"><div><p class="kicker">The Bunker / Members receiving clearly</p><h2>Join the Frequency.</h2><p>A classified drip-feed of new drops, strange ideas, field notes, sales, encoded nonsense, and suspicious discounts.</p></div><form class="signup" name="frequency" method="POST" action="/" data-netlify="true"><input type="hidden" name="form-name" value="frequency"><input type="text" name="bot-field" class="trap" tabindex="-1" autocomplete="off"><label class="sr-only" for="signup-email">Email address</label><div><input id="signup-email" name="email" type="email" required placeholder="Enter your authorized frequency"><button type="submit" class="button yellow">Join ${icon("arrow-right")}</button></div><small>No spam. No lizard people. Probably.</small><p class="form-result" role="status"></p></form></section>`;
}
function header() {
  return `<header class="header"><a class="logo" href="/" aria-label="Tinfoil Hat home">TINFOIL HAT<span>Question everything</span></a><nav class="desktop-nav" aria-label="Main navigation"><a href="/shop">Shop</a><a href="/collections">Collections</a><a href="/about">About the Signal</a><a href="/journal">Journal</a></nav><div class="header-tools"><a class="icon-link" href="/shop#search" aria-label="Search archive">${icon("search")}</a><a class="cart-link" href="/cart">${icon("shopping-bag")}<span>Cart (${cart.reduce((a, x) => a + x.qty, 0)})</span></a><button class="menu-toggle icon-button" aria-expanded="${menu}" aria-controls="mobile-nav" aria-label="${menu ? "Close" : "Open"} menu">${icon(menu ? "x" : "menu")}</button></div><nav id="mobile-nav" class="mobile-nav ${menu ? "open" : ""}" aria-label="Mobile navigation"><a href="/shop">Shop the Archive</a><a href="/collections">Collections</a><a href="/about">About the Signal</a><a href="/journal">Transmission Log</a><a href="/cart">Your Evidence Bag</a></nav></header>`;
}
function footer() {
  return `<footer><a class="logo" href="/">TINFOIL HAT<span>Question everything</span></a><div class="footer-links"><a href="/shop">The Archive</a><a href="/about">Our Story</a><a href="/shipping">Shipping & Returns</a><a href="/contact">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div><p>Conspiracy-inspired apparel for the beautifully suspicious.</p><p class="footer-end">Protect the Signal. <span>© ${new Date().getFullYear()} Tinfoil Hat</span></p></footer>`;
}
function home() {
  return `<section class="hero"><div class="hero-copy"><p class="scrap-note">Some questions should never be forgotten.</p><h1><span>Protect</span><span>the Signal.</span></h1><p>Conspiracy-inspired apparel<br>for the beautifully suspicious.</p>${link("/shop", "Shop the Archive", "button outline")}<p class="scribble">The official story has terrible merch.</p></div><a class="hero-evidence" href="/product/black-file"><img src="/assets/products/black-file.webp" alt="Black File Tee revealed through torn evidence papers" width="1000" height="1000"><span class="tag">Freshly decoded / Black File</span><span class="evidence-caption">Classified until never.</span></a></section><section class="section featured"><h2 class="torn-title">Field-Issued Apparel for Unapproved Thoughts.</h2><div class="product-grid">${catalog
    .filter((p) => p.feature)
    .map(card)
    .join(
      "",
    )}</div><div class="underlined-link">${link("/shop", "Enter the full archive", "text-link")}</div></section><section class="collection-strip">${collections.map(([name]) => link("/shop?collection=" + encodeURIComponent(name), name, "collection-link")).join("")}</section><section class="born"><div class="archive-photo"><span>Transmission 1997<br>33 seconds.<br>Protect the signal.</span></div><div class="paper story-excerpt"><p class="kicker">True story, probably.</p><h2>Born Under Static.</h2><h3>The world is too strange for boring clothes.</h3><p>We are not here to sell fear. We are here to celebrate wonder, suspicion, absurdity, and the electric little thrill of asking, “What else might be true?”</p>${link("/about", "Open the founding file", "text-link")}</div><div class="manifesto-scrap"><h3>Good clothes.<br>Question things.</h3><p>We believe skepticism and wonder should sit at the same table.</p><span class="highlight">Not approved by any agency.</span></div></section>${signup()}`;
}
function shop() {
  return `<section class="page-intro"><p class="kicker">Archive access / No clearance required</p><h1>The Archive.</h1><p>Printed for comfort. Designed for signal recognition. Approved by absolutely no agency.</p></section><section class="section shop"><div class="shop-tools"><label class="search-box" id="search">${icon("search")}<span class="sr-only">Search products</span><input type="search" id="product-search" value="${escape(search)}" placeholder="Search the evidence"></label><label>Sort <select id="sort"><option value="featured">Archive order</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="name">Name</option></select></label></div><div class="filters" role="group" aria-label="Collections">${["all", ...new Set([...catalog.map((p) => p.collection), "Alt Thinking"])].map((c) => `<button type="button" data-filter="${escape(c)}" aria-pressed="${filter === c}">${c === "all" ? "All Evidence" : c}</button>`).join("")}</div><div id="shop-results"></div></section>${signup()}`;
}
function renderShopResults() {
  let list = catalog.filter(
    (p) =>
      (filter === "all" || p.collection === filter) &&
      `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  if (sort === "low") list.sort((a, b) => price(a) - price(b));
  if (sort === "high") list.sort((a, b) => price(b) - price(a));
  if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  $("#shop-results").innerHTML =
    `<p class="result-count">${list.length} artifact${list.length === 1 ? "" : "s"} recovered</p><div class="product-grid">${list.map(card).join("")}</div>${list.length ? "" : `<div class="empty paper"><h2>No signal on this frequency.</h2><p>Try another collection or search.</p><button class="button yellow" data-reset>View all evidence</button></div>`}`;
  icons();
}
function product(p) {
  const colors = p.variants.length
    ? [...new Set(p.variants.map((v) => v.color))]
    : p.prepped
      ? ["Ivory"]
      : ["Black", "Pepper", "Ivory"];
  const initial =
    p.defaultColor && colors.includes(p.defaultColor)
      ? p.defaultColor
      : p.id === "abduction-protocol" && colors.includes("Ivory")
        ? "Ivory"
        : colors[0];
  const sizes = p.variants.length
    ? [...new Set(p.variants.map((v) => v.size))]
    : ["S", "M", "L", "XL", "XXL"];
  return `<section class="product-page"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/shop">The Archive</a> / <a href="/shop?collection=${encodeURIComponent(p.collection)}">${escape(p.collection)}</a></nav><div class="product-layout"><div class="gallery"><div class="product-stage ${p.feature ? "" : p.prepped ? "art-only light-art" : "art-only"}"><img id="main-product" src="${image(p)}" alt="${escape(p.name)}" width="1200" height="1200"><button type="button" class="zoom-button icon-button" aria-label="Enlarge product image">${icon("zoom-in")}</button><span class="tag">Evidence / ${escape(p.id)}</span></div><div class="thumbnails" role="group" aria-label="Product image views"><button type="button" data-view="photo" aria-pressed="true"><img src="${image(p)}" alt="Garment"><span>Garment</span></button><button type="button" data-view="art" aria-pressed="false"><img src="${image(p, "art", initial)}" alt="Original artwork"><span>Artwork</span></button></div><p class="image-note">Original artwork available in the gallery.</p></div><div class="purchase paper"><p class="kicker">${escape(p.collection)} / ${p.feature ? "Freshly decoded" : "Archive edition"}</p><h1>${escape(p.name)}</h1><p class="price" id="product-price">${money(price(p))} ${p.variants.length ? "" : "<small>Preview price</small>"}</p><p>${escape(p.description)}</p><form id="product-form" data-id="${p.id}"><fieldset><legend>Color: <span id="color-name">${initial}</span></legend><div class="swatches">${colors.map((c) => `<label title="${escape(c)}"><input type="radio" name="color" value="${escape(c)}" ${c === initial ? "checked" : ""}><span style="--swatch:${c === "Black" ? "#171717" : c === "Pepper" ? "#575954" : c === "Ivory" ? "#eee9db" : "#777"}"></span><small>${escape(c)}</small></label>`).join("")}</div></fieldset><fieldset><legend>Size</legend><div class="sizes">${sizes.map((s) => `<label><input type="radio" name="size" value="${s}" required><span>${s}</span></label>`).join("")}</div><button type="button" class="text-link" data-size-guide>Fit notes ${icon("arrow-right")}</button></fieldset><div class="quantity"><span>Quantity</span><button type="button" data-qty="-1" aria-label="Decrease quantity">${icon("minus")}</button><input type="number" name="qty" value="1" min="1" max="10" aria-label="Quantity"><button type="button" data-qty="1" aria-label="Increase quantity">${icon("plus")}</button></div><p class="form-error" role="alert"></p><button class="button yellow full" type="submit">Add Evidence ${icon("shopping-bag")}</button></form><p class="small">This is not just a shirt. It is a wearable transmission.</p><div class="details"><details open><summary>${icon("shirt")} Fit & field notes ${icon("chevron-down")}</summary><p>Fits like standard Earth apparel. If you are between sizes, size up for a relaxed, “I have documents in my trunk” silhouette.</p></details><details><summary>${icon("radio")} Care instructions ${icon("chevron-down")}</summary><p>Wash cold. Tumble dry low. Do not iron the signal. Do not dry clean unless your dry cleaner has clearance.</p></details><details><summary>${icon("arrow-right")} Terrestrial dispatch ${icon("chevron-down")}</summary><p>Shipping is calculated at checkout. Products are made to order. Your order confirmation will carry the latest dispatch information.</p><a href="/shipping">Shipping & returns</a></details></div></div></div><div class="product-story paper"><h2>Wear the question.</h2><p>${productCopy}</p></div><h2 class="torn-title">Related Apparel.</h2><div class="product-grid related">${catalog
    .filter((x) => x.id !== p.id && x.feature)
    .slice(0, 3)
    .map(card)
    .join("")}</div></section>${signup()}`;
}
function cartPage() {
  return `<section class="page-intro"><p class="kicker">Personal effects / Evidence bag</p><h1>Your Evidence.</h1></section><section class="section"><div class="cart-layout"><div>${
    cart.length
      ? cart
          .map((line, i) => {
            const p = catalog.find((p) => p.id === line.id);
            return p
              ? `<article class="cart-item paper"><a href="/product/${p.id}"><img src="${image(p)}" alt="${escape(p.name)}" width="160" height="160"></a><div><a href="/product/${p.id}"><h2>${escape(p.name)}</h2></a><p>${escape(line.color)} / ${escape(line.size)}</p><div class="quantity"><button data-cart-qty="${i}" data-delta="-1" aria-label="Decrease ${escape(p.name)} quantity">${icon("minus")}</button><span>${line.qty}</span><button data-cart-qty="${i}" data-delta="1" aria-label="Increase ${escape(p.name)} quantity">${icon("plus")}</button><button class="remove" data-remove="${i}" aria-label="Remove ${escape(p.name)}">${icon("x")}</button></div></div><strong>${money(linePrice(line) * line.qty)}</strong></article>`
              : "";
          })
          .join("")
      : `<div class="empty paper"><h2>Your cart is currently free of evidence.</h2>${link("/shop", "Return to the Archive", "button yellow")}</div>`
  }</div><aside class="cart-summary paper"><p class="kicker">Transmission summary</p><h2>Secure the evidence.</h2><div class="total"><span>Subtotal</span><strong>${money(subtotal())}</strong></div><p>Shipping and tax calculated at checkout.</p>${cart.length ? link("/checkout", "Secure the Transmission", "button yellow full") : ""}${link("/shop", "Keep investigating", "text-link")}</aside></div></section>`;
}
function checkout() {
  return `<section class="page-intro"><p class="kicker">Approved terrestrial channels</p><h1>Secure the Transmission.</h1><p>Shipping and tax will be calculated before you pay.</p></section><section class="section"><div class="checkout-layout"><form id="checkout-form" class="paper checkout-form"><h2>Dispatch coordinates</h2><div class="form-grid">${[
    ["name", "Full name", "text"],
    ["email", "Email address", "email"],
    ["address1", "Street address", "text"],
    ["address2", "Apartment / suite (optional)", "text"],
    ["city", "City", "text"],
    ["state_code", "State / province code", "text"],
    ["zip", "Postal code", "text"],
  ]
    .map(
      ([n, l, t]) =>
        `<label>${l}<input type="${t}" name="${n}" ${n === "address2" ? "" : "required"} autocomplete="${n === "name" ? "name" : n === "email" ? "email" : n === "address1" ? "address-line1" : n === "address2" ? "address-line2" : n === "city" ? "address-level2" : n === "state_code" ? "address-level1" : "postal-code"}"></label>`,
    )
    .join(
      "",
    )}<label>Country<select name="country_code">${capabilities.countries.map((c) => `<option value="${c}">${c === "US" ? "United States" : c}</option>`).join("")}</select></label></div><button class="button yellow" ${!capabilities.enabled || !cart.length ? "disabled" : ""}>Calculate shipping ${icon("arrow-right")}</button><p class="form-result" role="status">${capabilities.enabled ? "" : "Checkout is not open yet. Keep your evidence bag for the next transmission."}</p></form><aside class="paper checkout-summary"><h2>Evidence summary</h2><p>${cart.length} selected artifact${cart.length === 1 ? "" : "s"}</p><div class="total"><span>Subtotal</span><strong>${money(subtotal())}</strong></div><div id="quote-result"></div></aside></div></section>`;
}
function about() {
  return `<section class="page-intro"><p class="kicker">For Those Receiving Clearly</p><h1>Born Under Static.</h1><p>We are not here to convince you. We are here to dress the question.</p></section><section class="about-grid section"><article class="paper prose"><h2>The world is too strange for boring clothes.</h2>${story.map((p) => `<p>${p}</p>`).join("")}<h2>Beautifully unconvinced.</h2><p>Tinfoil Hat is an apparel brand for conspiracy romantics, UFO watchers, fringe thinkers, midnight researchers, simulation skeptics, mushroom philosophers, and anyone who has ever paused a documentary and whispered, “Wait a minute.”</p><p>Our designs live somewhere between classified evidence, desert gas station merch, occult field notes, and a bootleg concert tee from a band that only plays during eclipses.</p><p>We are not here to sell fear. We are here to celebrate wonder, suspicion, absurdity, and the electric little thrill of asking, “What else might be true?”</p></article><aside class="manifesto"><h2>We believe.</h2>${manifesto.map((p) => `<p>${p}</p>`).join("")}<span class="highlight">The shirt should not be hidden.</span></aside></section>${signup()}`;
}
function collectionsPage() {
  return `<section class="page-intro"><p class="kicker">Four doors into the unknown</p><h1>Unlocked Side Doors.</h1></section><section class="section collection-grid">${collections.map(([n, h, p], i) => `<article class="paper"><span class="file-number">0${i + 1}</span><h2>${n}</h2><h3>${h}</h3><p>${p}</p>${link("/shop?collection=" + encodeURIComponent(n), "Browse " + n, "button dark")}</article>`).join("")}</section>${signup()}`;
}
function journal() {
  return `<section class="page-intro"><p class="kicker">Field notes / Unofficial theories</p><h1>The Transmission Log.</h1><p>The Signal is not a belief system. It is a feeling.</p></section><section class="section journal-grid">${Object.entries(
    articles,
  )
    .map(
      ([slug, a], i) =>
        `<article class="paper"><p class="kicker">${a.tag}</p><span class="journal-symbol">${icon(["radio", "shirt", "eye", "mail"][i])}</span><h2>${a.title}</h2><p>${a.paragraphs[0].slice(0, 140)}…</p>${link("/journal/" + slug, "Open transmission", "text-link")}</article>`,
    )
    .join("")}</section>${signup()}`;
}
function article(slug) {
  const a = articles[slug];
  return a
    ? `<section class="section prose paper long-article"><p class="kicker">${a.tag}</p><h1>${a.title}</h1>${a.paragraphs.map((p) => `<p>${p}</p>`).join("")}${link("/journal", "Back to the Log", "text-link")}</section>${signup()}`
    : notFound();
}
function info(route) {
  const pages = {
    shipping: [
      "Shipping & Returns",
      "Dispatched through approved terrestrial channels.",
      "Our apparel is made to order. Shipping and tax are shown before payment. Availability and dispatch estimates depend on the garment and delivery address.",
      "Checkout will open after the shipping and return policy is confirmed. For questions about fit, damaged items, or an existing order, contact the brand through the contact page.",
    ],
    privacy: [
      "Privacy",
      "Keep your signal yours.",
      "Your cart is saved in this browser. Newsletter signups are submitted to our email-list form. If you place an order, the delivery and payment information required for that order is handled by our payment providers and fulfillment partner.",
      "We do not request payment-card details on this site. Card and PayPal payments are handled on the provider’s checkout. A final business privacy policy will be published before commerce opens.",
    ],
    terms: [
      "Terms",
      "The official uniform of unofficial theories.",
      "The stories and transmissions here are brand mythology, humor, and creative expression. Apparel designs celebrate curiosity and do not establish the truth of any theory.",
      "The archive is currently available for browsing. Product prices shown in preview mode are illustrative. Final terms, merchant identity, taxes, delivery, and returns will be published before sales begin.",
    ],
    contact: [
      "Contact the Bunker",
      "Transmission channel open.",
      "Questions about a design, an order, or a suspiciously comfortable shirt? Use the contact form below.",
      "We read incoming transmissions. No clearance required.",
    ],
  };
  const a = pages[route];
  return `<section class="section paper prose long-article"><p class="kicker">Tinfoil Hat / ${route}</p><h1>${a[0]}</h1><h2>${a[1]}</h2><p>${a[2]}</p><p>${a[3]}</p>${route === "contact" ? `<form class="contact-form" name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field"><input type="hidden" name="form-name" value="contact"><input name="bot-field" class="trap" tabindex="-1"><label>Your name<input name="name" required></label><label>Email<input name="email" type="email" required></label><label>Transmission<textarea name="message" rows="6" required></textarea></label><button class="button yellow">Send transmission ${icon("arrow-right")}</button><p class="form-result" role="status"></p></form>` : ""}</section>`;
}
function notFound() {
  return `<section class="empty paper"><p class="kicker">404 / Missing evidence</p><h1>This page has been redacted.</h1>${link("/shop", "Return to the Archive", "button yellow")}</section>`;
}
function subtotal() {
  return cart.reduce((s, l) => s + linePrice(l) * l.qty, 0);
}
function icons() {
  createIcons({ icons: iconSet, attrs: { "stroke-width": 1.7 } });
}
function save() {
  localStorage.setItem("tinfoil-cart-v2", JSON.stringify(cart));
}
function announce(s) {
  $("#announcer").textContent = s;
  setTimeout(() => {
    if ($("#announcer").textContent === s) $("#announcer").textContent = "";
  }, 4500);
}
function render() {
  let path = decodeURIComponent(location.pathname).replace(/\/$/, "") || "/";
  let view,
    title = "Protect the Signal";
  if (path === "/") view = home();
  else if (path === "/shop") {
    view = shop();
    title = "The Archive";
  } else if (path.startsWith("/product/")) {
    const p = catalog.find((p) => p.id === path.split("/")[2]);
    view = p ? product(p) : notFound();
    title = p?.name || "Redacted";
  } else if (path === "/cart") view = cartPage();
  else if (path === "/checkout") view = checkout();
  else if (path === "/about") view = about();
  else if (path === "/collections") view = collectionsPage();
  else if (path === "/journal") view = journal();
  else if (path.startsWith("/journal/")) view = article(path.split("/")[2]);
  else if (["shipping", "privacy", "terms", "contact"].includes(path.slice(1)))
    view = info(path.slice(1));
  else if (path === "/order")
    view = `<section class="empty paper"><p class="kicker">Order status</p><h1>Receiving your transmission.</h1><p id="order-status" role="status">Checking payment status…</p>${link("/shop", "Back to the Archive", "button yellow")}</section>`;
  else view = notFound();
  document.title = title + " | Tinfoil Hat";
  $("#app").innerHTML =
    header() +
    `<main id="main"><div class="status-strip">${live ? "Field-issued apparel / Protect the Signal." : "Archive preview / Orders open with the next transmission."}</div>${view}</main>` +
    footer() +
    `<dialog id="image-dialog"><button class="icon-button" data-close-dialog aria-label="Close image">${icon("x")}</button><img alt="Enlarged artwork"></dialog><dialog id="fit-dialog"><button class="icon-button" data-close-dialog aria-label="Close fit notes">${icon("x")}</button><h2>Fits like Earth apparel.</h2><p>If you are between sizes, size up for a relaxed fit. Product-specific size measurements will appear once the garment is connected.</p></dialog>`;
  if (path === "/shop") {
    renderShopResults();
    $("#sort").value = sort;
  }
  icons();
  if (path === "/order") checkOrder();
  if (location.hash === "#search") $("#product-search")?.focus();
}
function navigate(href) {
  history.pushState({}, "", href);
  menu = false;
  filter = new URLSearchParams(location.search).get("collection") || "all";
  render();
  window.scrollTo(0, 0);
  $("#main").setAttribute("tabindex", "-1");
  $("#main").focus({ preventScroll: true });
}
document.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (
    a &&
    a.origin === location.origin &&
    !e.ctrlKey &&
    !e.metaKey &&
    !a.hasAttribute("download") &&
    a.target !== "_blank"
  ) {
    e.preventDefault();
    navigate(a.pathname + a.search + a.hash);
    return;
  }
  const b = e.target.closest("button");
  if (!b) return;
  if (b.matches(".menu-toggle")) {
    menu = !menu;
    $("#mobile-nav").classList.toggle("open", menu);
    b.setAttribute("aria-expanded", String(menu));
    b.setAttribute("aria-label", menu ? "Close menu" : "Open menu");
  }
  if (b.dataset.filter) {
    filter = b.dataset.filter;
    history.replaceState(
      {},
      "",
      filter === "all"
        ? "/shop"
        : "/shop?collection=" + encodeURIComponent(filter),
    );
    document
      .querySelectorAll("[data-filter]")
      .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderShopResults();
  }
  if (b.hasAttribute("data-reset")) {
    filter = "all";
    search = "";
    navigate("/shop");
  }
  if (b.dataset.qty) {
    const q = $('[name="qty"]');
    q.value = Math.max(
      1,
      Math.min(10, Number(q.value) + Number(b.dataset.qty)),
    );
  }
  if (b.dataset.view) {
    const p = catalog.find((p) => p.id === $("#product-form").dataset.id),
      color = $('[name="color"]:checked').value;
    $("#main-product").src = image(p, b.dataset.view, color);
    document
      .querySelectorAll("[data-view]")
      .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }
  if (b.matches(".zoom-button")) {
    $("#image-dialog img").src = $("#main-product").src;
    $("#image-dialog img").alt = $("#main-product").alt;
    $("#image-dialog").showModal();
  }
  if (b.hasAttribute("data-close-dialog")) b.closest("dialog").close();
  if (b.hasAttribute("data-size-guide")) $("#fit-dialog").showModal();
  if (b.dataset.cartQty !== undefined) {
    const i = Number(b.dataset.cartQty);
    cart[i].qty = Math.max(
      0,
      Math.min(10, cart[i].qty + Number(b.dataset.delta)),
    );
    cart = cart.filter((l) => l.qty > 0);
    save();
    render();
  }
  if (b.dataset.remove !== undefined) {
    cart.splice(Number(b.dataset.remove), 1);
    save();
    render();
  }
  if (b.dataset.pay) pay(b.dataset.pay, b);
});
document.addEventListener("input", (e) => {
  if (e.target.id === "product-search") {
    search = e.target.value;
    renderShopResults();
  }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "sort") {
    sort = e.target.value;
    renderShopResults();
  }
  if (["color", "size"].includes(e.target.name) && $("#product-form")) {
    const color = $('[name="color"]:checked').value;
    $("#color-name").textContent = color;
    const p = catalog.find((p) => p.id === $("#product-form").dataset.id);
    const art = $('[data-view="art"]').getAttribute("aria-pressed") === "true";
    $("#main-product").src = image(p, art ? "art" : "photo", color);
    const variant = p.variants.find(
      (v) => v.color === color && v.size === $('[name="size"]:checked')?.value,
    );
    if (variant) $("#product-price").textContent = money(variant.price);
    if (live)
      document.querySelectorAll('[name="size"]').forEach((input) => {
        input.disabled = !p.variants.some(
          (v) => v.color === color && v.size === input.value && v.available,
        );
        if (input.disabled) input.checked = false;
      });
    announce("Selection updated.");
  }
});
document.addEventListener("submit", async (e) => {
  const f = e.target;
  if (f.id === "product-form") {
    e.preventDefault();
    const d = new FormData(f),
      p = catalog.find((p) => p.id === f.dataset.id),
      v = p.variants.find(
        (v) => v.color === d.get("color") && v.size === d.get("size"),
      );
    if (live && (!v || !v.available)) {
      $(".form-error").textContent =
        "That size and color are not available. Choose another combination.";
      return;
    }
    cart = addLine(cart, {
      id: p.id,
      color: d.get("color"),
      size: d.get("size"),
      qty: Number(d.get("qty")),
    });
    save();
    announce("Evidence added to your cart.");
    navigate("/cart");
  } else if (f.matches(".signup,.contact-form")) {
    e.preventDefault();
    const b = f.querySelector("button"),
      s = f.querySelector(".form-result");
    b.disabled = true;
    try {
      const r = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(f)),
      });
      if (
        !r.ok ||
        location.hostname === "127.0.0.1" ||
        location.hostname === "localhost"
      )
        throw Error();
      s.textContent = f.matches(".contact-form")
        ? "Transmission received. Your message is in the bunker."
        : "Transmission received. You are on the frequency.";
      f.reset();
    } catch {
      s.textContent =
        "The transmission did not go through. Please try again when the site is online.";
    } finally {
      b.disabled = false;
    }
  } else if (f.id === "checkout-form") {
    e.preventDefault();
    const s = f.querySelector(".form-result"),
      b = f.querySelector("button");
    b.disabled = true;
    s.textContent = "Calculating terrestrial channels…";
    try {
      const result = await api("quote", {
        cart,
        address: Object.fromEntries(new FormData(f)),
      });
      sessionStorage.setItem("tinfoil-quote", JSON.stringify(result));
      $("#quote-result").innerHTML =
        `<div class="total"><span>Shipping</span><strong>${money(result.shipping / 100)}</strong></div><div class="total"><span>Tax</span><strong>${money(result.tax / 100)}</strong></div><div class="total"><span>Total</span><strong>${money(result.total / 100)}</strong></div><button class="button yellow full" data-pay="stripe" ${!capabilities.stripe ? "disabled" : ""}>Pay by Card ${icon("arrow-right")}</button><button class="button dark full" data-pay="paypal" ${!capabilities.paypal ? "disabled" : ""}>PayPal ${icon("arrow-right")}</button><p class="small" id="payment-result" role="status"></p>`;
      icons();
      s.textContent = "Dispatch quote locked. Choose your payment method.";
    } catch (err) {
      s.textContent = err.message;
    } finally {
      b.disabled = false;
    }
  }
});
async function api(path, body) {
  const r = await fetch("/api/" + path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json();
  if (!r.ok)
    throw Error(d.error || "Transmission interrupted. Please try again.");
  return d;
}
async function pay(provider, b) {
  b.disabled = true;
  try {
    const q = JSON.parse(sessionStorage.getItem("tinfoil-quote"));
    const r = await api("checkout", {
      quoteId: q.id,
      token: q.token,
      provider,
    });
    sessionStorage.setItem(
      "tinfoil-order",
      JSON.stringify({ id: q.id, token: q.token }),
    );
    location.assign(r.url);
  } catch (err) {
    $("#payment-result").textContent = err.message;
    b.disabled = false;
  }
}
async function checkOrder() {
  try {
    const saved = JSON.parse(sessionStorage.getItem("tinfoil-order") || "null");
    if (!saved)
      throw Error(
        "No order is attached to this browser. Check your payment confirmation email.",
      );
    const token = new URLSearchParams(location.search).get("token");
    if (token)
      await api("paypal-capture", {
        id: saved.id,
        token: saved.token,
        paypalOrderId: token,
      });
    const r = await api("order", { id: saved.id, token: saved.token });
    $("#order-status").textContent = r.paid
      ? "Transmission received. Your package is entering the grid. Order " +
        r.reference
      : "Payment confirmation is still arriving. Your cart remains saved; refresh this page shortly.";
    if (r.paid) {
      cart = [];
      save();
    }
  } catch (err) {
    $("#order-status").textContent = err.message;
  }
}
window.addEventListener("popstate", () => {
  filter = new URLSearchParams(location.search).get("collection") || "all";
  menu = false;
  render();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menu) {
    menu = false;
    $("#mobile-nav").classList.remove("open");
    $(".menu-toggle").setAttribute("aria-expanded", "false");
    $(".menu-toggle").focus();
  }
});
render();
Promise.allSettled([api("config"), api("catalog")]).then(([c, p]) => {
  if (c.status === "fulfilled") capabilities = c.value;
  if (p.status === "fulfilled" && p.value.live) {
    live = true;
    catalog = catalog.map((x) => ({
      ...x,
      ...p.value.products.find((y) => y.id === x.id),
    }));
  }
  render();
});
