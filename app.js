const WOO_BASE_URL = "https://tinfoildesign.com";
const WOO_PRODUCTS_ENDPOINT = `${WOO_BASE_URL}/wp-json/wc/store/v1/products?per_page=24`;
const WOO_PRODUCTS_JSONP_ENDPOINT = `${WOO_PRODUCTS_ENDPOINT}&_jsonp=`;

const fallbackProducts = [
  {
    id: "signal-protection",
    name: "Protect the Signal Tee",
    category: "UFO Culture",
    price: 38,
    color: "black",
    print: "sigil",
    mark: "TH",
    description: "A wearable transmission for people who know the rabbit hole has excellent acoustics.",
  },
  {
    id: "redacted-fit",
    name: "Redacted Goods Long Sleeve",
    category: "Conspiracy Inspired",
    price: 54,
    color: "light",
    print: "redacted",
    mark: "",
    description: "Black bars, clean cotton, and the eternal beauty of paperwork with secrets.",
  },
  {
    id: "hollow-moon",
    name: "Hollow Moon Field Tee",
    category: "Fringe Ideas",
    price: 42,
    color: "gray",
    print: "target",
    mark: "",
    description: "For theories that get laughed out of the room before returning with citations.",
  },
  {
    id: "mushroom-wifi",
    name: "Mushrooms Are Listening Tee",
    category: "Alt Thinking",
    price: 40,
    color: "black",
    print: "mushroom",
    mark: "",
    description: "Soft, suspicious, and field-ready for forest walks that become philosophy.",
  },
  {
    id: "watchers-cap",
    name: "The Watchers Cap",
    category: "Conspiracy Inspired",
    price: 34,
    color: "light",
    print: "sigil",
    mark: "◎",
    description: "For watching the watchers without making the whole brunch weird immediately.",
  },
  {
    id: "desert-files",
    name: "Desert Files Hoodie",
    category: "UFO Culture",
    price: 78,
    color: "gray",
    print: "redacted",
    mark: "",
    description: "Heavyweight comfort for missing time, cold highways, and strangely bright skies.",
  },
  {
    id: "ancient-battery",
    name: "Ancient Battery Tee",
    category: "Fringe Ideas",
    price: 39,
    color: "black",
    print: "target",
    mark: "",
    description: "Built for sudden 2:13 a.m. research spirals and pyramid acoustics debates.",
  },
  {
    id: "simulation-side-door",
    name: "Unlocked Side Door Crew",
    category: "Alt Thinking",
    price: 62,
    color: "light",
    print: "sigil",
    mark: "404",
    description: "Reality has a weird fit. This one is better.",
  },
];

let products = [...fallbackProducts];
let activeFilter = "all";
let productSource = "local";
const cart = new Map();
const productGrid = document.querySelector("[data-products]");
const filterBar = document.querySelector(".filter-bar");
const cartDrawer = document.querySelector(".cart-drawer");
const cartItems = document.querySelector("[data-cart-items]");
const cartCount = document.querySelector("[data-cart-count]");
const cartTotal = document.querySelector("[data-cart-total]");
const shopStatus = document.querySelector("[data-shop-status]");

function decodeHtml(value = "") {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function stripHtml(value = "") {
  const element = document.createElement("div");
  element.innerHTML = value;
  return element.textContent.replace(/\s+/g, " ").trim();
}

function truncateText(value = "", maxLength = 170) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPrice(product) {
  if (product.priceHtml) return escapeHtml(product.priceHtml);
  return `$${escapeHtml(product.price)}`;
}

function getWooPrice(product) {
  const rawPrice = Number(product.prices?.price || product.prices?.regular_price || 0);
  const minorUnit = Number(product.prices?.currency_minor_unit ?? 2);
  const amount = rawPrice / 10 ** minorUnit;
  return Number.isFinite(amount) ? amount : 0;
}

function getWooPriceHtml(product) {
  const range = product.prices?.price_range;
  if (range?.min_amount && range?.max_amount) {
    const minorUnit = Number(product.prices?.currency_minor_unit ?? 2);
    const prefix = product.prices?.currency_prefix || "$";
    const min = Number(range.min_amount) / 10 ** minorUnit;
    const max = Number(range.max_amount) / 10 ** minorUnit;
    return `${prefix}${min.toFixed(minorUnit)} - ${prefix}${max.toFixed(minorUnit)}`;
  }

  const htmlPrice = stripHtml(product.price_html || "");
  return htmlPrice || "";
}

function getWooCategory(product) {
  return product.categories?.[0]?.name || "Field Wear";
}

function getPrintStyle(index) {
  const styles = [
    { color: "black", print: "sigil", mark: "TH" },
    { color: "light", print: "redacted", mark: "" },
    { color: "gray", print: "target", mark: "" },
    { color: "black", print: "mushroom", mark: "" },
  ];
  return styles[index % styles.length];
}

function normalizeWooProduct(product, index) {
  const style = getPrintStyle(index);
  const category = decodeHtml(getWooCategory(product));
  const description =
    stripHtml(product.short_description || product.description) ||
    "Field-ready apparel pulled straight from the live WooCommerce archive.";

  return {
    id: String(product.id),
    name: decodeHtml(product.name),
    category,
    price: getWooPrice(product),
    priceHtml: getWooPriceHtml(product),
    color: style.color,
    print: style.print,
    mark: style.mark,
    description: truncateText(description),
    image: product.images?.[0]?.src || "",
    url: product.permalink || `${WOO_BASE_URL}/?p=${product.id}`,
    addToCartUrl: `${WOO_BASE_URL}/cart/?add-to-cart=${product.id}`,
    type: product.type || "",
  };
}

function isPurchasableDirectly(product) {
  return productSource === "woocommerce" && product.type === "simple";
}

function getProductButtonLabel(product) {
  if (productSource !== "woocommerce") return "Add Evidence";
  return isPurchasableDirectly(product) ? "Add on Woo" : "Choose Options";
}

function getStatusText(count) {
  if (productSource === "woocommerce") {
    return `Live transmission locked: ${count} WooCommerce products from tinfoildesign.com. Checkout stays on your existing store.`;
  }

  return "Live WooCommerce products were not reachable from this page, so the local concept archive is standing in.";
}

function loadProductsJsonp() {
  return new Promise((resolve, reject) => {
    const callbackName = `tinfoilProducts_${Date.now()}`;
    const script = document.createElement("script");

    window[callbackName] = (data) => {
      delete window[callbackName];
      script.remove();
      resolve(data);
    };

    script.onerror = () => {
      delete window[callbackName];
      script.remove();
      reject(new Error("WooCommerce JSONP request failed"));
    };

    script.src = `${WOO_PRODUCTS_JSONP_ENDPOINT}${callbackName}`;
    document.head.appendChild(script);
  });
}

async function fetchWooProducts() {
  try {
    const response = await fetch(WOO_PRODUCTS_ENDPOINT, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`WooCommerce returned ${response.status}`);
    }

    return response.json();
  } catch (error) {
    return loadProductsJsonp();
  }
}

function renderProducts(category = "all") {
  activeFilter = category;
  const visibleProducts =
    category === "all" ? products : products.filter((product) => product.category === category);

  if (!visibleProducts.length) {
    productGrid.innerHTML = `<p class="empty">No products found on this frequency.</p>`;
    return;
  }

  productGrid.innerHTML = visibleProducts
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-visual ${product.color} ${product.image ? "has-image" : ""}">
            ${
              product.image
                ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" />`
                : `<span class="shirt-neck"></span>
                   <span class="print ${product.print}">${escapeHtml(product.mark)}<span></span></span>`
            }
          </div>
          <div class="product-info">
            <div class="product-meta">
              <span>${escapeHtml(product.category)}</span>
              <span>${productSource === "woocommerce" ? "Live archive" : "Freshly decoded"}</span>
            </div>
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(product.description)}</p>
            <div class="product-buy">
              <strong>${formatPrice(product)}</strong>
              <button class="add-button" type="button" data-add="${product.id}">
                ${getProductButtonLabel(product)}
              </button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderFilters() {
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];
  const availableCategories = categories.slice(0, 5);
  const activeStillExists = activeFilter === "all" || availableCategories.includes(activeFilter);
  activeFilter = activeStillExists ? activeFilter : "all";

  filterBar.innerHTML = [
    `<button class="filter ${activeFilter === "all" ? "active" : ""}" type="button" data-filter="all">All</button>`,
    ...availableCategories.map(
      (category) =>
        `<button class="filter ${activeFilter === category ? "active" : ""}" type="button" data-filter="${escapeHtml(category)}">${escapeHtml(category)}</button>`,
    ),
  ].join("");
}

function renderCart() {
  const entries = [...cart.values()];
  const count = entries.reduce((sum, item) => sum + item.quantity, 0);
  const total = entries.reduce((sum, item) => sum + item.price * item.quantity, 0);

  cartCount.textContent = count;
  cartTotal.textContent = `$${total}`;

  if (!entries.length) {
    cartItems.innerHTML =
      productSource === "woocommerce"
        ? `<p class="empty">WooCommerce checkout is handled at tinfoildesign.com. Product buttons send buyers there.</p>`
        : '<p class="empty">Your cart is currently free of evidence.</p>';
    return;
  }

  cartItems.innerHTML = entries
    .map(
      (item) => `
        <div class="cart-item">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <span>${item.quantity} transmission${item.quantity > 1 ? "s" : ""}</span>
          </div>
          <strong>$${item.price * item.quantity}</strong>
        </div>
      `,
    )
    .join("");
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-visible");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-visible");
}

filterBar.addEventListener("click", (event) => {
  const filter = event.target.closest("[data-filter]");
  if (!filter) return;

  filterBar.querySelectorAll("[data-filter]").forEach((button) => button.classList.remove("active"));
  filter.classList.add("active");
  renderProducts(filter.dataset.filter);
});

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (!button) return;

  const product = products.find((item) => item.id === button.dataset.add);
  if (!product) return;

  if (productSource === "woocommerce") {
    window.location.href = isPurchasableDirectly(product) ? product.addToCartUrl : product.url;
    return;
  }

  const current = cart.get(product.id) || { ...product, quantity: 0 };
  current.quantity += 1;
  cart.set(product.id, current);
  renderCart();
  openCart();
});

document.querySelector("[data-cart-open]").addEventListener("click", openCart);
document.querySelector("[data-cart-close]").addEventListener("click", closeCart);

cartDrawer.addEventListener("click", (event) => {
  if (event.target === cartDrawer) closeCart();
});

document.querySelector(".signup").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = event.currentTarget.querySelector("input");
  input.value = "";
  input.placeholder = "Transmission received";
});

async function loadWooProducts() {
  try {
    const wooProducts = await fetchWooProducts();
    if (!Array.isArray(wooProducts) || wooProducts.length === 0) {
      throw new Error("WooCommerce returned no products");
    }

    products = wooProducts.map(normalizeWooProduct);
    productSource = "woocommerce";
  } catch (error) {
    console.warn("Using local fallback products:", error);
    products = [...fallbackProducts];
    productSource = "local";
  }

  shopStatus.textContent = getStatusText(products.length);
  renderFilters();
  renderProducts(activeFilter);
  renderCart();
}

renderFilters();
renderProducts();
renderCart();
loadWooProducts();
