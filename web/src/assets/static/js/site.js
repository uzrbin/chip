$(document).ready(function() {
		scrollHandle();
});

var prevScroll = 0;

function scrollHandle() {
	if ($(window).scrollTop() == 0) {
		$('.navbar-brand').animate({ 'font-size': '7em', 'line-height': '0.8em' });
	} else if (prevScroll == 0) {
		$('.navbar-brand').animate({ 'font-size': '1.5em', 'line-height': '20px' });
	}
	
	prevScroll = $(window).scrollTop();
}

$(window).scroll( scrollHandle ).resize( scrollHandle );
