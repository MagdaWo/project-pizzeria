import { select, classNames, templates } from "../settings.js";
import utils from "../utils.js";
import AmountWidget from "./AmountWidget.js";

class Product {
constructor(id, data) {
const thisProduct = this;
thisProduct.id = id;
thisProduct.data = data;
thisProduct.renderInMenu();
thisProduct.getElements();
thisProduct.initAccordion();
thisProduct.initOrderForm();
thisProduct.initAmountWidget();
thisProduct.processOrder();


}
renderInMenu() {
const thisProduct = this;

//generate HTML based on template
const generatedHTML = templates.menuProduct(thisProduct.data);
// create element using utils.createElementFromHTML
thisProduct.element = utils.createDOMFromHTML(generatedHTML);
//find menu container
const menuContainer = document.querySelector(select.containerOf.menu);
//add element to menu
menuContainer.appendChild(thisProduct.element);
}

getElements() {
const thisProduct = this;

thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
}

initAccordion() {
const thisProduct = this;
thisProduct.accordionTrigger.addEventListener('click', function (event) {

event.preventDefault();
const activeProducts = document.querySelectorAll(select.all.menuProductsActive);
for (let activeProduct of activeProducts) {
if (activeProduct !== thisProduct.element) {
activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
}
}
thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
});

}

initOrderForm() {
const thisProduct = this;

thisProduct.form.addEventListener('submit', function (event) {
event.preventDefault();
thisProduct.processOrder();
});

for (let input of thisProduct.formInputs) {
input.addEventListener('change', function () {
thisProduct.processOrder();
});
}

thisProduct.cartButton.addEventListener('click', function (event) {
event.preventDefault();
thisProduct.processOrder();
thisProduct.addToCart();
});

}

processOrder() {
const thisProduct = this;

// covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
const formData = utils.serializeFormToObject(thisProduct.form);


// set price to default price
let price = thisProduct.data.price;

// for every category (param)...
for (let paramId in thisProduct.data.params) {
// determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
const param = thisProduct.data.params[paramId];


// for every option in this category
for (let optionId in param.options) {
// determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
const option = param.options[optionId];


const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

if (optionSelected && !option.default) {
price += option.price;

}
if (!optionSelected && option.default) {
price -= option.price;

}

const optionImage = thisProduct.imageWrapper.querySelector(`.${paramId}-${optionId}`);
if (optionImage) {
if (optionSelected) {
optionImage.classList.add(classNames.menuProduct.imageVisible);
} else {
optionImage.classList.remove(classNames.menuProduct.imageVisible);
}
}
}
}
price *= thisProduct.amountWidget.value;
thisProduct.priceSingle = price / thisProduct.amountWidget.value;
thisProduct.priceElem.innerHTML = price;
}

initAmountWidget() {
const thisProduct = this;

thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);

thisProduct.amountWidgetElem.addEventListener('updated', function () {
thisProduct.processOrder();
});
}

addToCart() {
const thisProduct = this;
// const productSummary = thisProduct.prepareCartProduct();
thisProduct.name = thisProduct.data.name;
thisProduct.amount = thisProduct.amountWidget.value;
//app.cart.add(productSummary);

const event = new CustomEvent('add-to-cart', {
bubbles: true,
detail: {
product: thisProduct.prepareCartProduct(),
},
});
thisProduct.element.dispatchEvent(event);
}

prepareCartProduct() {
const thisProduct = this;

const productSummary = {
id: thisProduct.id,
name: thisProduct.data.name,
amount: thisProduct.amountWidget.value,
priceSingle: thisProduct.priceSingle,
price: thisProduct.priceSingle * thisProduct.amountWidget.value,
params: thisProduct.prepareCartProductParams(),

};

return productSummary;
}

prepareCartProductParams() {
const thisProduct = this;

const formData = utils.serializeFormToObject(thisProduct.form);
const params = {};

// for very category (param)
for (let paramId in thisProduct.data.params) {
const param = thisProduct.data.params[paramId];

// create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
params[paramId] = {
label: param.label,
options: {}
}

// for every option in this category
for (let optionId in param.options) {
const option = param.options[optionId];
const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

if (optionSelected) {
// option is selected!
params[paramId].options[optionId] = option.label;
}
}
}

return params;
}
}

export default Product;