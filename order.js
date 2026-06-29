// order-system.js - Interactive Ordering Layer

// 1. Create Floating Cart UI elements dynamically
const cartDOM = document.createElement('div');
cartDOM.innerHTML = `
  <div id="floating-cart-badge" onclick="toggleCartOverlay(true)" style="position:fixed; bottom:20px; right:20px; background:#6f4e37; color:#fff; padding:15px 20px; border-radius:50px; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-family:'DM Sans',sans-serif; z-index:9999; display:none; align-items:center; gap:10px;">
    🛒 <span id="cart-count">0</span> items (<span id="cart-total-badge">$0.00</span>)
  </div>

  <div id="order-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:10000; display:none; justify-content:center; align-items:center; font-family:'DM Sans',sans-serif; backdrop-filter: blur(5px);">
    <div id="order-modal" style="background:#fff; width:90%; max-width:450px; border-radius:15px; padding:25px; box-shadow:0 10px 25px rgba(0,0,0,0.2); position:relative; max-height:85vh; overflow-y:auto;">
      <button onclick="toggleCartOverlay(false)" style="position:absolute; top:15px; right:15px; background:none; border:none; font-size:1.5rem; cursor:pointer; color:#888;">&times;</button>
      
      <div id="step-cart">
        <h3 style="font-family:'Playfair Display',serif; color:#333; margin-top:0;">Your Selected Delights</h3>
        <div id="cart-items-list" style="margin:20px 0; max-height:200px; overflow-y:auto; border-bottom:1px solid #eee; padding-bottom:10px;"></div>
        <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.1rem; margin-bottom:20px;">
          <span>Total:</span>
          <span id="cart-grand-total">$0.00</span>
        </div>
        <button onclick="goToCheckoutStep('step-location')" style="width:100%; background:#6f4e37; color:white; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer;">Proceed to Buy</button>
      </div>

      <div id="step-location" style="display:none;">
        <h3 style="font-family:'Playfair Display',serif; color:#333; margin-top:0;">Delivery Destination</h3>
        <p style="font-size:0.9rem; color:#666;">Where should we bring your warm sip?</p>
        <div style="margin:15px 0;">
          <label style="display:block; margin-bottom:5px; font-size:0.85rem;">Delivery Address</label>
          <textarea id="order-address" rows="3" style="width:100%; box-sizing:border-box; padding:10px; border:1px solid #ccc; border-radius:6px;" placeholder="Flat/House No., Building, Street Name..."></textarea>
        </div>
        <button onclick="goToCheckoutStep('step-payment')" style="width:100%; background:#6f4e37; color:white; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer;">Proceed to Payment</button>
      </div>

      <div id="step-payment" style="display:none;">
        <h3 style="font-family:'Playfair Display',serif; color:#333; margin-top:0;">Secure Simulation Payment</h3>
        <p style="font-size:0.9rem; color:#666;">Choose a simulated payment method:</p>
        <div style="margin:20px 0; display:flex; flex-direction:column; gap:10px;">
          <label style="border:1px solid #ddd; padding:12px; border-radius:6px; display:flex; align-items:center; gap:10px; cursor:pointer;">
            <input type="radio" name="pay-method" value="UPI" checked> 📱 UPI / QR Code Scanner
          </label>
          <label style="border:1px solid #ddd; padding:12px; border-radius:6px; display:flex; align-items:center; gap:10px; cursor:pointer;">
            <input type="radio" name="pay-method" value="Card"> 💳 Credit or Debit Card
          </label>
        </div>
        <button onclick="processSimulatedPayment()" style="width:100%; background:#27ae60; color:white; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer;">Pay Now Securely</button>
      </div>

      <div id="step-success" style="display:none; text-align:center; padding:20px 0;">
        <div style="font-size:4rem; color:#27ae60; margin-bottom:10px;">🎉</div>
        <h3 style="font-family:'Playfair Display',serif; color:#333; margin-top:0;">Payment Confirmed!</h3>
        <p style="color:#27ae60; font-weight:bold; margin-bottom:5px;">Order Sent Successfully</p>
        <p id="success-summary" style="font-size:0.9rem; color:#666; line-height:1.4;"></p>
        <button onclick="clearAndCloseCart()" style="background:#6f4e37; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; margin-top:15px;">Enjoy Your Day!</button>
      </div>

    </div>
  </div>
`;
document.body.appendChild(cartDOM);

// Cart App State Variable Tracking
let cart = [];

function addToCart(itemName, itemPrice) {
  const numericPrice = parseFloat(itemPrice.replace('$', ''));
  const existingItem = cart.find(i => i.name === itemName);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ name: itemName, price: numericPrice, quantity: 1 });
  }
  updateCartUI();
  
  // Subtle animation on cart item addition
  const badge = document.getElementById('floating-cart-badge');
  badge.style.transform = "scale(1.15)";
  setTimeout(() => badge.style.transform = "scale(1)", 150);
}

function updateCartUI() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  document.getElementById('cart-count').innerText = totalCount;
  document.getElementById('cart-total-badge').innerText = `$${totalCost.toFixed(2)}`;
  document.getElementById('cart-grand-total').innerText = `$${totalCost.toFixed(2)}`;
  
  // Show badge if cart has items, hide if empty
  document.getElementById('floating-cart-badge').style.display = totalCount > 0 ? 'flex' : 'none';
  
  // Re-render internal Cart list layout inside Modal
  const itemsContainer = document.getElementById('cart-items-list');
  if (cart.length === 0) {
    itemsContainer.innerHTML = `<p style="color:#aaa; text-align:center;">Your order list is empty.</p>`;
    return;
  }
  
  itemsContainer.innerHTML = cart.map((item, index) => `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:0.95rem;">
      <div>
        <strong>${item.name}</strong> <span style="color:#666; font-size:0.85rem;">(x${item.quantity})</span>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <span>$${(item.price * item.quantity).toFixed(2)}</span>
        <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-weight:bold;">&times;</button>
      </div>
    </div>
  `).join('');
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
  if(cart.length === 0) toggleCartOverlay(false);
}

function toggleCartOverlay(show) {
  document.getElementById('order-overlay').style.display = show ? 'flex' : 'none';
  if (show) goToCheckoutStep('step-cart'); // Reset to first cart view on open
}

function goToCheckoutStep(stepId) {
  if (stepId === 'step-location' && cart.length === 0) return;
  if (stepId === 'step-payment' && !document.getElementById('order-address').value.trim()) {
    alert("Please supply a delivery address so we can route your driver!");
    return;
  }
  
  // Hide all checkout container blocks
  ['step-cart', 'step-location', 'step-payment', 'step-success'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  // Show specified step container
  document.getElementById(stepId).style.display = 'block';
}

function processSimulatedPayment() {
  const address = document.getElementById('order-address').value;
  const paymentMethod = document.querySelector('input[name="pay-method"]:checked').value;
  const itemsSummary = cart.map(i => `${i.name} x${i.quantity}`).join(', ');
  
  document.getElementById('success-summary').innerHTML = `
    Your items (<strong>${itemsSummary}</strong>) are preparing.<br>
    Delivering via <strong>${paymentMethod}</strong> pipeline straight to:<br> 
    <em>"${address}"</em>. Thank you for choosing One More Sip!
  `;
  
  goToCheckoutStep('step-success');
}

function clearAndCloseCart() {
  cart = [];
  document.getElementById('order-address').value = '';
  updateCartUI();
  toggleCartOverlay(false);
}