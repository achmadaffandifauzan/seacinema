// if on small screens, navbar padding change to py-3 when it's collapsed,
// but need refresh page to work if there are screen changes (user might change screen size on web)
if (screen.width <= 768) {
  const navToggler = document.querySelector(".navbar-toggler");
  if (navToggler) {
    if (navToggler.classList.contains("collapsed")) {
      document.querySelector("#nav").classList.remove("py-3");
    } else if (!navToggler.classList.contains("collapsed")) {
      document.querySelector("#nav").classList.add("py-3");
    }
  }
}
