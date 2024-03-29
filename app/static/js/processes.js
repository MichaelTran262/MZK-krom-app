$(document).ready(function() {
    generate_table();
    setInterval(generate_table, 2000);
});

function generate_table() {
    url = '/api/processes'
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    const options = {
        weekday: 'long', // "úterý" (Tuesday)
        year: 'numeric', // "2023"
        month: 'long', // "červen" (June)
        day: 'numeric', // "28"
        hour: 'numeric', // "14" (2 PM)
        minute: 'numeric', // "30"
        second: 'numeric', // "15"
        timeZone: 'Europe/Prague' // Assuming the time is in Prague's time zone
      };     
    $.ajax({
        type: 'GET',
        async: true,
        url: url,
        data: {'page': page},
        dataType: 'json',
        success: function(data) {
            let content = $('#tableContent');
            content.empty();
            for(let i = 0; i < data.procs.length; i++) {
                var row = "";
                row += '<td>' + data.procs[i].id + '</td>';
                let date = new Date(data.procs[i].created);             
                row += '<td>' + date.toLocaleString('cs-CZ', options) + '</td>';
                if (data.procs[i].planned == false) {
                    row += `<td>Ne</td>`
                } else {
                    if (data.procs[i].status == 'ProcessStatesEnum.PENDING') {
                        row += `<td>Ano, na následující pátek v 20 hodin</td>`
                    } else {
                        row += `<td>Ano</td>`
                    }
                }
                if (data.procs[i].status == 'ProcessStatesEnum.STARTED') {
                    row += '<td>Probíhá <i class="fa fa-circle-o-notch fa-spin"></i></td>';
                } else if (data.procs[i].status == 'ProcessStatesEnum.SUCCESS') {
                    row += '<td>Úspěch <i class="fa fa-check" style="color:green;"></i></td>';
                } else if (data.procs[i].status == 'ProcessStatesEnum.FAILURE') {
                    row += '<td>CHYBA <i class="fa fa-exclamation-circle" style="color:red;"></i></td>';
                } else if (data.procs[i].status == 'ProcessStatesEnum.REVOKED') {
                    row += '<td>Zrušen <i class="fa fa-times" style="color:red;"></i></td>';
                } else if (data.procs[i].status == 'ProcessStatesEnum.PENDING'){
                    row += '<td>Naplánován</td>';
                } else {
                    row += '<td>' + data.procs[i].status + '</td>';
                }
                row += '<td><a class="btn btn-primary" role="button" href="/process_folders/'+ data.procs[i].id + '">Zobrazit</a></td>'
                if(data.procs[i].status == 'ProcessStatesEnum.STARTED') {
                    row += '<td><button type="button" class="cancel-button btn btn-danger">Ukončit</button><a class="btn btn-info" role="button" href="/process/'+ data.procs[i].id + '">Info</a></td>';
                } else {
                    row += '<td><a class="btn btn-info" role="button" href="/process/'+ data.procs[i].id + '">Info</a></td>';
                }
                content.append("<tr id="+ data.procs[i].id+ "_" +data.procs[i].celery_task_id +">" + row + "</tr>");
                if(data.procs[i].status == 'ProcessStatesEnum.STARTED') {
                    progress = `
                    <tr >
                        <td class="border-left" colspan="6">
                        <div class="progress" style="height: 32px;">
                            <div id="transferProgressBar-${ data.procs[i].id }" class="progress-bar progress-bar-striped progress-bar-animated" style="display:block"></div>
                        </div>
                        <div id="transferProgressText-${ data.procs[i].id }"></div>
                        </td>
                    </tr>`;
                    content.append(progress); 
                    id = data.procs[i].id;
                    url = '/api/processes/progress/' + id + '/';
                    $.ajax({
                        type: 'GET',
                        url: url,
                        async: false,
                        dataType: 'json',
                        success: function(data) {
                            if (data.total_files == 0) {
                                return;
                            }
                            if (data.current_files == data.total_files) {
                                $('#transferProgressBar-' + id).closest('tr').hide();
                                $('#cancel-' + id).html('-');
                                $('#status-' + id).html('SUCCESS');
                            }
                            let percent = Math.floor((data.current_files/data.total_files)*100);
                            let width_style = percent.toString() + "%";
                            let label = data.current_files + "/" + data.total_files + ' souborů, ' + data.current_space.toFixed(2) + '/' + data.total_space.toFixed(2) + ' MB';
                            $('#transferProgressBar-' + id).css("width", width_style);
                            $('#transferProgressText-' + id).html(label);
                        },
                        error: function(data) {
                            console.log("update_transfer_progress failed");
                        }
                    });
                }
            };
            $('.cancel-button').on('click', function() {
                id = $(this).closest('tr').attr('id');
                proc_id = id.split('_')[0]
                uuid =  id.split('_')[1];
                url = '/api/processes/celery_task/remove/' + uuid;
                if (confirm("Chcete proces " + id + " opravdu ukončit?")) {
                    proc = new Object();
                    proc["id"] = proc_id;
                    $.ajax({
                        type: 'POST',
                        async: true,
                        url: url,
                        data: JSON.stringify(proc),
                        contentType: 'application/json; charset=utf-8',
                        dataType: 'json',
                        success: function(data) {
                            alert(data.message);
                        },
                        error: function(data) {
                            console.log(data);
                        }
                    });
                }
            });
        },
        error: function(data) {
            console.log(data);
        }
    });
}