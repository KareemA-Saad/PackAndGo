import { collection, getDocs, deleteDoc, doc, updateDoc, query, where } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, app } from "./firebase-config.js";
import { updateCartCount } from "./cart-item.js";
let auth = getAuth(app);
let currentUserId = null; 

async function removeItemFromFirestoreAndLocal(docId, id, color, userId) {
  try {
    await deleteDoc(doc(db, "carts", docId));
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter(item => !(item.id === id && item.color === color));
    localStorage.setItem("cart", JSON.stringify(cart));

    await displayCartItems(userId);  
  } catch (error) {
    alert("Error while deleting item Please Try again");
  }
  updateCartCount();
}

async function displayCartItems(userId) {
  let container = document.querySelector(".cart-item-container-cart");
  if (!container) return;

  container.innerHTML = "";

  if (!userId) {
    container.innerHTML = "<h2>Please login to see your cart.</h2>";
    updateSummary(0);
    return;
  }

  try {
    let q = query(collection(db, "carts"), where("userId", "==", userId));
    let querySnapshot = await getDocs(q);
    let cart = [];
    
    querySnapshot.forEach((docSnap) => {
      let data = docSnap.data();
      data._id = docSnap.id;
      cart.push(data);
    });

    if (cart.length === 0) {
      container.innerHTML = "<h2>The cart is empty</h2>";
      updateSummary(0);
      return;
    }

    cart.forEach((item) => {
      let itemDiv = document.createElement("div");
      itemDiv.classList.add("cart-item");
      itemDiv.style.display = "flex";
      itemDiv.style.alignItems = "center";
      itemDiv.style.justifyContent = "space-between";
      itemDiv.style.marginBottom = "10px";

      itemDiv.innerHTML = `
        <div class="cart-z-content" style="display:flex; align-items:center; gap:10px;">
          <img src="${item.image}" alt="${item.title}" style="width:80px; height:80px; object-fit:cover;" />
          <div>
            <h4 style="margin-bottom:5px;">
              <a href="productDetails.html?id=${item.id}" style="color: #fff; text-decoration: underline;">
                 ${item.title}
              </a>
            </h4>
            <p style="margin:10px;"><span style="display: block;width: 30px;
          height: 30px;
          background-color: ${item.colorHEX};
          border-radius: 50%; border:1px solid #fff ;
          margin-bottom:10px;"></span></p>
            <p style="margin-bottom:5px;">Quantity : 
              <input type="number" min="1" value="${item.quantity}" 
                      class="quantity-input" 
                      data-docid="${item._id}" 
                      data-price="${item.price}" 
                      style="width: 50px; padding: 2px; border: 1.5px solid #ccc; border-radius: 7px;"/>
            </p>
            <p>Item-Price : $${item.price}</p>
          </div>
        </div>
        <button class="delete-btn"
                data-docid="${item._id}"
                data-id="${item.id}"
                data-color="${item.color}"
                title="Delete item"
                style="background:none; border:none; cursor:pointer; font-size:22px; color:#e74c3c;">
          <i class="fas fa-trash-alt"></i>
        </button>
      `;

      container.appendChild(itemDiv);
    });

    let totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let totalDiv = document.createElement("div");
    totalDiv.style.marginTop = "20px";
    totalDiv.style.fontWeight = "bold";
    totalDiv.style.fontSize = "18px";
    totalDiv.style.color = "#fff";
    totalDiv.textContent = `Total Price: $${totalPrice.toFixed(2)}`;
    container.appendChild(totalDiv);

    updateSummary(totalPrice);

    container.querySelectorAll(".delete-btn").forEach(button => {
      button.addEventListener("click", async (e) => {
        let docId = e.currentTarget.dataset.docid;
        let id = e.currentTarget.dataset.id;
        let color = e.currentTarget.dataset.color;

        if (!docId || !id || !color) {
          return;
        }

        let confirmDelete = confirm("Do you want to delete this item?");
        if (confirmDelete) {
          await removeItemFromFirestoreAndLocal(docId, id, color, userId);
        }
      });
    });

    let isUpdating = false;

    async function updateQuantity(docId, newQty) {
      if (isUpdating) return;
      isUpdating = true;

      try {
        let itemRef = doc(db, "carts", docId);
        await updateDoc(itemRef, { quantity: newQty });

        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        cart = cart.map(item => {
          if (item._id === docId) {
            item.quantity = newQty;
          }
          return item;
        });
        localStorage.setItem("cart", JSON.stringify(cart));

        await displayCartItems(userId);
      } catch (error) {
        console.error("Failed to update quantity Try again");
      } 
        isUpdating = false;
    }

    container.querySelectorAll(".quantity-input").forEach(input => {
      input.addEventListener("change", async (e) => {
        let newQty = parseInt(e.target.value);
        let docId = e.target.dataset.docid;

        if (isNaN(newQty) || newQty < 1) {
          alert("The quantity must be a positive number.");
          e.target.value = 1;
          return;
        }

        await updateQuantity(docId, newQty);
      });
    });

  } catch (error) {
    container.innerHTML = "<p>Can't loading cart.</p>";
  }
  updateCartCount();
}

function updateSummary(totalPrice) {
  let subtotalElement = document.querySelector(".summary-row:first-child .price");
  let totalElement = document.querySelector(".summary-row.total .price");
  let itemCountElement = document.querySelector(".summary-row.items .count");

  let cart = (JSON.parse(localStorage.getItem("cart")) || [])
    .filter(item => item && typeof item.quantity === "number" && item.quantity > 0);

  let totalItems = cart.length;

  if (itemCountElement) {
    itemCountElement.textContent = `${totalItems}`;
  }

  if (subtotalElement && totalElement) {
    subtotalElement.textContent = `$${totalPrice.toFixed(2)}`;
    totalElement.textContent = `$${totalPrice.toFixed(2)}`;
  }
  updateCartCount();
}

window.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserId = user.uid;
      displayCartItems(currentUserId);
    } else {
      currentUserId = null;
      displayCartItems(null);
    }
  });
});

export { displayCartItems };
