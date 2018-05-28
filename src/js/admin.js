/* global vex */

(() => {
  'use strict';
  let replyOpenTimer = null;

  vex.defaultOptions.className = 'vex-theme-default';

  $('#formsTable').DataTable();
  const socket = io();

  socket.on('reply:locked', function(replyId) {
    $('tr[data-reply-id="' + replyId +'"]').addClass('locked');
  });
  
  socket.on('reply:unlocked', function(replyId) {
    $('tr[data-reply-id="' + replyId +'"]').removeClass('locked');
  });
  
  $(document).on('click', '.delete-reply-btn', function(e) {
    var id = $(e.target).closest('.delete-reply-btn').attr('data-id');
    vex.dialog.confirm({
      message: 'Haluatko varmasti poistaa vastauksen pysyvästi?',
      callback: function (value) {
        if (value) {
          $.ajax({
            url: '/admin/replies/' + id,
            type: 'DELETE',
            success: function(response) {
              $(e.target).parents('tr').remove();
            }
          });
        }
      }
    });
  });
  
  $('.xlsx-export').click((e) => {
    e.preventDefault();
    
    var includeFiltered = typeof($(this).attr('data-include-filtered')) !== 'undefined' && $(this).attr('data-include-filtered') !== false;

    $.getJSON('/admin/fields', (fields) => {
      vex.dialog.open({
        message: 'Valitse vietävät kentät',
        input: renderXlsxExportModal({
          fields: fields
        }),
        callback: (data) => {
          if (data) {
            var fields = encodeURIComponent(Object.keys(data).join(','));
            var url = '/admin/export/xlsx?fields='+fields;
            if (includeFiltered) {
              url += '&includeFiltered=true';
            }
            window.open(url);
          }
        }
      });
    });
  });

  $(document).ready(() => {
    $('.metaform-container').each((index, element) => {
      const replyId = $(element).attr('data-reply-id');

      socket.emit('reply:opened', {
        'replyId': replyId
      });

      replyOpenTimer = setInterval(() => {
        socket.emit('reply:opened', {
          'replyId': replyId
        });
      }, 20000);
    });
  });

  $(window).on("unload", () => {
    $('.metaform-container').each((index, element) => {
      const replyId = $(element).attr('data-reply-id');
      clearInterval(replyOpenTimer);
      socket.emit('reply:closed', {
        'replyId': replyId
      });
    });
  });
  
})();