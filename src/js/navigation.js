
(() => {
  'use strict';

  function toggleNavigation () {
    if ($('.mobile-navigation').hasClass('open')) {
      closeNavigation();
    } else {
      openNavigation();
    }
  }

  function closeNavigation () {
    $('.mobile-navigation').hide();
    $('.mobile-navigation').removeClass('open');
  }

  function openNavigation () {
    $('.mobile-navigation').show();
    $('.mobile-navigation').addClass('open');
  }

  $(document).ready(() => {
    $(document).on('click', '.nav-toggle', () => {
      toggleNavigation();
    });    

    $('main').on('click', '*', () => {
      closeNavigation();
    });
  });
  
})();