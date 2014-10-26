function makeGroupRow(group) {
	var str = '<tr>';
	str += '<td>'+group.groupme_id+'</td>';
	str += '<td>'+group.bot_key+'</td>';
	str += '<td class="text-center">'+(group.scout?'<span class="glyphicon glyphicon-ok"></span>':
			'<span class="glyphicon glyphicon-remove"></span>')+'</td>';
	str += '<td class="text-center">'+(group.output?'<span class="glyphicon glyphicon-ok"></span>':
			'<span class="glyphicon glyphicon-remove"></span>')+'</td>';
	str += '<td class="text-center">'+(group.debug?'<span class="glyphicon glyphicon-ok"></span>':
			'<span class="glyphicon glyphicon-remove"></span>')+'</td>';
	str += '<td class="text-center"><a href="#" class="edit"><span class="glyphicon glyphicon-edit"></span></a></td>'
	str += '</tr>';
	return $(str);
}

var token = window.location.pathname.substr(window.location.pathname.lastIndexOf('/')+1);
var groups = {};
var synd;

$.get('/api/groups/'+token).success(function(resp) {
	if (resp.error) {
		console.log(resp.error);
	} else {
		var container = $('#group-list');
		
		$('.synd-name').html(resp.synd.name);
		synd = resp.synd;
			
		resp.groups.forEach(function(g) {
			groups[g.gid] = g;
			
			var row = makeGroupRow(g);
			row.data('gid', g.gid);
			container.append(row);
		});
	}
}).error(function(err) {
	console.log(err);
});

$(document).ready(function() {
	$('#group-list').on('click', '.edit', function(e) {
		e.preventDefault();
		var $self = $(this);
		var group = groups[$self.parents('tr').data('gid')];
		
		$('#gid').val(group.gid);
		$('#groupmeId').val(group.groupme_id);
		$('#botToken').val(group.bot_key);
		$('#output').prop('checked', group.output);
		$('#scout').prop('checked', group.scout);
		$('#debug').prop('checked', group.debug);
		$('#group-edit').fadeIn();
	});
	
	$('#group-add').on('click', function(e) {
		$('input').val('');
		$('input[type=checkbox]').prop('checked', false);		
		$('#group-edit').fadeIn();
	});
	
	$('#group-edit-cancel').on('click', function(e) {	
		e.preventDefault();	
		$('#group-edit').fadeOut();
	});
	
	$('form').on('submit', function(e) {
		e.preventDefault();
		$('#group-edit').fadeOut();
		
		var grp = {
			gid: $('#gid').val(),
			groupme_id: $('#groupmeId').val(),
			bot_key: $('#botToken').val(),
			output: $('#output').prop('checked'),
			scout: $('#scout').prop('checked'),
			debug: $('#debug').prop('checked')
		}
		
		if ($('#gid').val()) {
			$.ajax({
				type: 'POST',
				url: '/api/group/'+$('#gid').val(),
				data: grp
			}).success(function(resp) {
				$.each($('#group-list tr'), function(i, g) {
					var $row = $(g);
					if ($row.data('gid') == $('#gid').val()) {
						groups[resp.gid] = resp;
						$row.replaceWith(makeGroupRow(resp).data('gid', resp.gid));
					}
				});
			});
		} else {
			grp.sid = synd.sid;
			
			$.ajax({
				type: 'PUT',
				url: '/api/group/',
				data: grp
			}).success(function(resp) {
				console.log(resp);
				groups[resp.gid] = resp;
				$('#group-list').append(makeGroupRow(resp).data('gid', resp.gid));
			});
		}
	});
});
