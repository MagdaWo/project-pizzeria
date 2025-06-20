import { settings, select, classNames } from "./settings.js"
import Product from "./components/Product.js";
import Cart from "./components/Cart.js";
import Booking from "./components/Booking.js";
import DatePicker from "./components/DatePicker.js";

const app = {

initPages: function () {
const thisApp = this;

thisApp.pages = document.querySelector(select.containerOf.pages).children;
thisApp.navLinks = document.querySelectorAll(select.nav.links);
const idFromHash = window.location.hash.replace('#/', '');

let pageMatchingHash = thisApp.pages[0].id;

for (let page of thisApp.pages) {
if (page.id == idFromHash) {
pageMatchingHash = page.id;
break;
}
}
thisApp.activatePage(pageMatchingHash);



for (let link of thisApp.navLinks) {
link.addEventListener('click', function (event) {
const clickedElement = this;
event.preventDefault();

/* get page id from href attribute */
const id = clickedElement.getAttribute('href').replace('#', '');

/* run thisApp.activatePage with that id */
thisApp.activatePage(id);

/*change url hash */
window.location.hash = '#/' + id;
});
}
},


activatePage: function (pageId) {
const thisApp = this;
/* add class "active to matching pages, remove from non-matching" */
for (let page of thisApp.pages) {
page.classList.toggle(classNames.pages.active, page.id == pageId);
/*if(page.id == pageId) {
page.classList.add(classNames.pages.active);
} else {
page.classList.remove(classNames.pages.active);
}
} */
}
/* add class "active to matching links, remove from non-matching" */
for (let link of thisApp.navLinks) {
link.classList.toggle(
classNames.nav.active,
link.getAttribute('href') == '#' + pageId
);
}

},

initMenu: function () {
const thisApp = this;
console.log('thisApp.data:', thisApp.data);
for (let productData of thisApp.data.products) {
new Product(productData.id, productData);
}
},

initData: function () {
const thisApp = this;
thisApp.data = {};
const url = settings.db.url + '/' + settings.db.products;

fetch(url)
.then(function (rawResponse) {
return rawResponse.json();
})
.then(function (parsedResponse) {
console.log('[parsedResponse', parsedResponse);

// save parsedResponse as this.App.data.products
thisApp.data.products = parsedResponse;
//execute initMenu method
thisApp.initMenu();
});

console.log('thisApp.data', JSON.stringify(thisApp.data));

},


initCart: function () {
const thisApp = this;

const cartElem = document.querySelector(select.containerOf.cart);
thisApp.cart = new Cart(cartElem);

thisApp.productList = document.querySelector(select.containerOf.menu);

thisApp.productList.addEventListener('add-to-cart', function (event) {
app.cart.add(event.detail.product);
});
},

initBooking: function () {
const thisApp = this;

const bookingContainer = document.querySelector(select.containerOf.booking);
thisApp.Booking = new Booking(bookingContainer);

const bookingWrapper = document.querySelector('.booking-wrapper');

if (bookingWrapper) {
const datePickerDiv = bookingWrapper.querySelector('.date-picker');

if (datePickerDiv) {
new DatePicker(datePickerDiv);
}
}
},

init: function () {
const thisApp = this;

thisApp.initPages();
thisApp.initData();
thisApp.initCart();
thisApp.initBooking();
}
};

//const testProduct = new Product();
//console.log('testProduct', testProduct);


app.init();

