const menuButton = document.querySelector(".btn__menu");
const navigation = document.querySelector("#main-navigation");

menuButton.addEventListener("click", function () {
  const isOpen = navigation.classList.toggle("is-open");

  menuButton.setAttribute("aria-expanded", isOpen);
});
