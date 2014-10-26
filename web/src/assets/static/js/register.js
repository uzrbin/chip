$(document).ready(function() {
	$('form').submit(function(e) {
		$.post('/api/register', {
				email: $(this).find('input[type=email]').val(),
				synd: $(this).find('input[type=synd]').val()
		}).success(function(resp) {
			if (resp.error) {
				$('#content').prepend($('<div class="alert alert-danger">'+resp.error+'</div>'));
			} else if (resp.token) {
				var link = 'http://chip.uzrbin.com/groups/'+resp.token;
				
				$('form').hide();
				$('#success h2').append($('<a href="'+link+'">'+link+'</a>'));
				$('#success').show();
			}
		}).error(function() {
			$('#content').prepend($('<div class="alert alert-danger">Error ! Change few things.</div>'));
		});
		
		e.preventDefault();
		return false;
	});
});
