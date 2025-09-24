/* script.js - FarmFresh
   - preserves inline onclick handlers like addToCart(...)
   - uses localStorage for cart persistence
   - renders cart list with R currency
   - lightweight form validation (non-destructive)
   - navbar active highlighting
   - cart badge updater
*/

(function () {
  "use strict";

  // Helper: parse price (accepts numbers or strings like "R12.99" or "12.99")
  function parsePrice(value) {
    if (typeof value === "number") return value;
    if (!value) return 0;
    // strip non-digits except dot
    const num = parseFloat(String(value).replace(/[^0-9.]/g, ""));
    return Number.isFinite(num) ? num : 0;
  }

  // Format as Rands
  function formatR(val) {
    return "R" + parseFloat(val).toFixed(2);
  }

  // Cart state (persisted)
  let cart = JSON.parse(localStorage.getItem("farmCart")) || [];

  // Expose addToCart globally so inline onclick works
  window.addToCart = function (productName, price, thumb) {
    const p = String(productName || "Item");
    const pr = parsePrice(price);
    const item = { name: p, price: pr, thumb: thumb || "" };
    cart.push(item);
    localStorage.setItem("farmCart", JSON.stringify(cart));
    updateCartBadge();
    // minor UI feedback
    try { showToast(`${p} added to cart`); } catch (e) {}
  };

  // Remove item by index (global, used by inline onclick in render)
  window.removeFromCart = function (index) {
    if (index < 0 || index >= cart.length) return;
    cart.splice(index, 1);
    localStorage.setItem("farmCart", JSON.stringify(cart));
    renderCart();
    updateCartBadge();
  };

  // Render cart (safe if elements not present on the page)
  function renderCart() {
    const cartItemsDiv = document.getElementById("cart-items");
    const cartTotalDiv = document.getElementById("cart-total");
    if (!cartItemsDiv || !cartTotalDiv) return;

    if (!cart.length) {
      cartItemsDiv.innerHTML = `<p>Your cart is empty.</p>`;
      cartTotalDiv.innerHTML = `<h3>Total: R0.00</h3>`;
      return;
    }

    let total = 0;
    const ul = document.createElement("ul");
    ul.className = "cart-list";

    cart.forEach((it, idx) => {
      total += parsePrice(it.price);
      const li = document.createElement("li");

      const left = document.createElement("div");
      left.className = "cart-item-left";

      if (it.thumb) {
        const img = document.createElement("img");
        img.className = "cart-thumb";
        img.src = it.thumb;
        img.alt = it.name;
        left.appendChild(img);
      }

      const title = document.createElement("div");
      title.className = "cart-title";
      title.textContent = it.name;
      left.appendChild(title);

      const priceSpan = document.createElement("div");
      priceSpan.className = "cart-price";
      priceSpan.textContent = formatR(it.price);

      const removeBtn = document.createElement("button");
      removeBtn.className = "btn remove-btn";
      removeBtn.textContent = "Remove";
      removeBtn.onclick = function () { removeFromCart(idx); };

      // assemble li
      li.appendChild(left);
      li.appendChild(priceSpan);
      li.appendChild(removeBtn);
      ul.appendChild(li);
    });

    cartItemsDiv.innerHTML = "";
    cartItemsDiv.appendChild(ul);

    cartTotalDiv.innerHTML = `<h3>Total: ${formatR(total)}</h3>`;
  }

  // Update cart badge in navbar (creates if missing)
  function updateCartBadge() {
    const cartLink = Array.from(document.querySelectorAll(".nav-links a"))
      .find(a => a.getAttribute("href") && a.getAttribute("href").includes("cart.html"));

    if (!cartLink) return;
    let badge = cartLink.querySelector(".cart-count");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "cart-count";
      cartLink.appendChild(badge);
    }
    badge.textContent = cart.length;
  }

  // showToast (small transient DOM message)
  function showToast(msg) {
    let t = document.getElementById("farm-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "farm-toast";
      t.style.position = "fixed";
      t.style.bottom = "20px";
      t.style.right = "20px";
      t.style.background = "rgba(20,20,20,0.9)";
      t.style.color = "#fff";
      t.style.padding = "10px 14px";
      t.style.borderRadius = "8px";
      t.style.zIndex = 9999;
      t.style.boxShadow = "0 6px 18px rgba(0,0,0,0.35)";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = "1";
    setTimeout(() => { t.style.opacity = "0"; }, 1600);
  }

  // Basic form validation (non-destructive)
  function attachFormValidation() {
    const forms = document.querySelectorAll("form");
    forms.forEach(form => {
      if (form.dataset.validationBound) return;
      form.dataset.validationBound = "1";

      form.addEventListener("submit", function (e) {
        const requiredEls = form.querySelectorAll("[required]");
        let ok = true;
        requiredEls.forEach(el => {
          if (!el.value || String(el.value).trim() === "") {
            ok = false;
            el.style.outline = "2px solid #e74c3c";
            el.focus();
          } else {
            el.style.outline = "";
          }
        });
        if (!ok) {
          e.preventDefault();
          alert("Please complete all required fields.");
        }
      }, { passive: false });
    });
  }

  // Navbar active link highlight using pathname comparison
  function markActiveNav() {
    const current = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".nav-links a").forEach(a => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      if (!href) return;
      if (href === current || (href.endsWith("index.html") && current === "")) {
        a.classList.add("active");
      } else {
        // allow exact match or folder match
        if (href === window.location.pathname) a.classList.add("active");
      }
    });
  }

  // Smooth internal anchor scroll for same-page anchors only
  function attachSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener("click", function (ev) {
        const targetSelector = this.getAttribute("href");
        if (!targetSelector || targetSelector === "#") return;
        const target = document.querySelector(targetSelector);
        if (target) {
          ev.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  // run on DOM ready
  document.addEventListener("DOMContentLoaded", function () {
    attachFormValidation();
    markActiveNav();
    attachSmoothScroll();
    renderCart();
    updateCartBadge();
  });

  // Expose helpers for debugging if needed
  window._farmFresh = {
    getCart: () => cart,
    clearCart: () => { cart = []; localStorage.removeItem("farmCart"); renderCart(); updateCartBadge(); }
  };

})();
