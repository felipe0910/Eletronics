

const avatarLibras = document.querySelector('#avatarLibras');

if (avatarLibras) {
   avatarLibras.addEventListener('click', () => {
      const btn = document.querySelector('[vw-access-button]');

      if (btn) {
         btn.click();
      }
   });
}