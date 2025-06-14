import { settings, select, classNames, templates } from "../settings.js";   
import cartProduct from "./CartProduct.js";
import utils from "../utils.js";
  
class Cart {
constructor(element) {
const thisCart = this;

thisCart.products = [];

thisCart.getElements(element);
thisCart.initActions();
}

getElements(element) {
const thisCart = this;

thisCart.dom = {};
thisCart.dom.wrapper = element;
thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
thisCart.dom.defaultDeliveryFee = element.querySelector(select.cart.deliveryFee);
thisCart.dom.subtotalPrice = element.querySelector(select.cart.subtotalPrice);
thisCart.dom.totalPrice = element.querySelectorAll(select.cart.totalPrice);
thisCart.dom.totalNumber = element.querySelector(select.cart.totalNumber);
thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
}

initActions() {
const thisCart = this;

thisCart.dom.toggleTrigger.addEventListener('click', function () {
thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
});

thisCart.dom.productList.addEventListener('updated', function () {
thisCart.update();
});

thisCart.dom.productList.addEventListener('remove', function (event) {
thisCart.remove(event.detail.cartProduct);
});

thisCart.dom.form.addEventListener('submit', function (event) {
event.preventDefault();
thisCart.sendOrder();
});
}

update() {
const thisCart = this;

const deliveryFee = settings.cart.defaultDeliveryFee;
let totalNumber = 0;
let subtotalPrice = 0;

for (let product of thisCart.products) {
totalNumber += product.amount;
subtotalPrice += product.price;
}

thisCart.totalPrice = totalNumber > 0 ? subtotalPrice + deliveryFee : 0;

thisCart.subtotalPrice = subtotalPrice;
thisCart.totalNumber = totalNumber;
thisCart.dom.defaultDeliveryFee.innerHTML = totalNumber > 0 ? deliveryFee : 0;

for (let priceElem of thisCart.dom.totalPrice) {
priceElem.innerHTML = thisCart.totalPrice;
}
}

add(menuProduct) {
const thisCart = this;
const generatedHTML = templates.cartProduct(menuProduct);
const generatedDOM = utils.createDOMFromHTML(generatedHTML);

thisCart.dom.productList.appendChild(generatedDOM);

console.log('adding product', menuProduct);

thisCart.products.push(new cartProduct(menuProduct, generatedDOM));
thisCart.update();
}

remove(cartProduct) {
const thisCart = this;

cartProduct.dom.wrapper.remove();

const index = thisCart.products.indexOf(cartProduct);
if (index !== -1) {
thisCart.products.splice(index, 1);
}

thisCart.update();
}

sendOrder() {
const thisCart = this;

const url = settings.db.url + '/' + settings.db.orders;

const payload = {
address: thisCart.dom.address.value,
phone: thisCart.dom.phone.value,
totalPrice: thisCart.totalPrice,
subtotalPrice: thisCart.subtotalPrice,
totalNumber: thisCart.totalNumber,
deliveryFee: settings.cart.defaultDeliveryFee,
products: [],
};

for (let prod of thisCart.products) {
payload.products.push(prod.getData());
}

const options = {
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify(payload),
};

fetch(url, options)
.then(function (response) {
return response.json();
}).then(function (parsedResponse) {
console.log('parsedResponse', parsedResponse);
});

}
}

export default Cart;