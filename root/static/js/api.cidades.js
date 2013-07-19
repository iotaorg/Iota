var zoom_padrao = 5;
var map;
var boxText;
var myOptions;
var ib;
var cidade_data;
var indicadores_data;
var graficos = [];


var functions = {};
$(document).ready(function(){

	function loadCidadeData(){

        loadIndicadoresData();
        if (!(typeof google == "undefined")){
            loadMap();
        }
		$.ajax({
			type: 'GET',
			dataType: 'json',
			url: api_path + '/api/public/user/$$id'.render({
							id: userID
					}),
			success: function(data, textStatus, jqXHR){
				cidade_data = data;
				showCidadeData();
			},
			error: function(data){
				console.log("erro ao carregar informações da cidade");
			}
		});
	}

	function loadMap(){

		var mapDefaultLocation = new google.maps.LatLng(-14.2350040, -51.9252800);
		var geocoder = new google.maps.Geocoder();

		var mapOptions = {
				center: mapDefaultLocation,
				zoom: zoom_padrao,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};

		map = new google.maps.Map(document.getElementById("mapa"),mapOptions);

		boxText = document.createElement("div");
		boxText.style.cssText = "border: 2px solid #20c1c1; margin-top: 8px; background: white; padding: 0px;";
		boxText.innerHTML = "";
		myOptions = {
			 content: boxText
			,disableAutoPan: false
			,maxWidth: 0
			,pixelOffset: new google.maps.Size(-100, 0)
			,zIndex: null
			,boxStyle: {
			  background: "url('/static/images/tipbox.gif') no-repeat"
			  ,opacity: 0.90
			  ,width: "200px"
			 }
			,closeBoxMargin: "10px 2px -13px 2px"
			,closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif"
			,infoBoxClearance: new google.maps.Size(1, 1)
			,isHidden: false
			,pane: "floatPane"
			,enableEventPropagation: false
		};

		ib = new InfoBox(myOptions);

		ib.close();

	}

	function setMap(lat,lng){
		var center = new google.maps.LatLng(lat, lng)
		map.setCenter(center);

		var image = new google.maps.MarkerImage("/static/images/pin.png");

		var marker = new google.maps.Marker({
			position: center,
			map: map,
			icon: image,
			draggable: false
		});

		marker.__position = center;

		google.maps.event.addListener(marker, 'mouseover', function(e) {
			map.setCenter(marker.__position);
			if (map.getZoom() < zoom_padrao) map.setZoom(zoom_padrao);
			showInfoWindow(marker,"marker");
		});


	}

	function showInfoWindow(marker,source){
		boxTextContent = "<table class='infowindow'><thead>";
		boxTextContent += "<tr>";
		boxTextContent += "<th>Prefeitura</th>";
		boxTextContent += "</tr></thead>";
		boxTextContent += "<tbody>";
		boxTextContent += "<tr>";
		if (cidade_data.cidade.endereco_prefeitura != null || cidade_data.cidade.telefone_prefeitura != null){
			boxTextContent += "<td>" + cidade_data.cidade.endereco_prefeitura + "<br />" + cidade_data.cidade.telefone_prefeitura + "</td>";
		}else{
			boxTextContent += "<td>Dados não informados</td>";
		}
		boxTextContent += "</tr>";
		boxTextContent += "</tbody></table>";

		boxText.innerHTML = boxTextContent;
		ib.close();
		ib.setContent(boxText);
		ib.open(map, marker);
	}




	function showCidadeData(){

        $("#cidades-dados .profile .title").html(cidade_data.cidade.name + ", " + cidade_data.cidade.uf);
        if (cidade_data.usuario.city_summary){
            $("#cidades-dados .summary .content-fill").html(cidade_data.usuario.city_summary);
        }




        $tabela = $('dl.tabela');
        var user_files = cidade_data.usuario.files;
        if (
            typeof(user_files.carta_compromis) != "undefined" ||
            typeof(user_files.programa_metas) != "undefined"
        ){
            $tabela.append("<dt>Links:</dt>");

            if (typeof(user_files.carta_compromis) != "undefined")
                $tabela.append("<dd><a href='$$dado' target='_blank'>Carta compromisso</a></dd>".render({dado: user_files.carta_compromis}));

            if (typeof(user_files.programa_metas) != "undefined")
                $tabela.append("<dd><a href='$$dado' target='_blank'>Programa de Metas</a></dd>".render({dado: user_files.programa_metas}));

        }


		if (typeof(user_files.imagem_cidade) != "undefined"){
            $("#cidades-dados .image").html('<img/>');
			$("#cidades-dados .image img")[0].src = user_files.imagem_cidade;
		}else{
            $("#cidades-dados .image").html('<div class="alert alert-block"><p>Cidade sem imagem!</p></div>');
        }

		//var diff = $("#cidades-dados .profile .content-fill").height() - $("#cidades-dados .profile").height() + 10;
		//if (diff > 10){
    //	$("#cidades-dados .profile").css("height","+="+diff);
    //		$("#cidades-dados .summary").css("height","+="+diff);
    //		$("#cidades-dados .map").css("height","+="+diff);
    //		$("#cidades-dados #mapa").css("height","+="+diff);
    //	}

		if (!(typeof google == "undefined")){
            if (cidade_data.cidade.latitude != null && cidade_data.cidade.longitude != null){
                setMap(cidade_data.cidade.latitude,cidade_data.cidade.longitude);
            }
        }

	}

	function loadIndicadoresData(){
        var param = typeof regionID == "undefined" ? '' : '?region_id=' +regionID;
		$.ajax({
			type: 'GET',
			dataType: 'json',
			url: (api_path + '/api/public/user/$$id/indicator'+param).render({
							id: userID
					}),
			success: function(data, textStatus, jqXHR){
				indicadores_data = data;
				showIndicadoresData();
			},
			error: function(data){
				console.log("erro ao carregar indicadores da cidade");
			}
		});
	}
	functions['loadIndicadoresData'] = loadIndicadoresData;

	function showIndicadoresData(){
        var table_content = '<table class="table table-striped table-hover">';
		$("#cidades-indicadores .table").empty();

		var cont = 0;

        var eixos_ordem = [];
        $.each(indicadores_data.resumos, function(eixo_index, eixo){
            eixos_ordem.push(eixo_index);
        });

        eixos_ordem.sort(function (a, b) {
            return a.localeCompare(b);
        });


		$.each(eixos_ordem, function(ix, eixo_index){
            var eixo = indicadores_data.resumos[eixo_index];

			table_content += "<thead class='eixos collapsed'><tr><th colspan='20'>$$eixo</th></thead>".render({eixo: eixo_index});

			var periods = eixo;
			$.each(periods, function(period_index, period){
				var datas = periods[period_index].datas;

				if (datas.length > 0){
					table_content += "<thead class='datas'><tr><th></th>";
					$.each(datas, function(index, value){
						table_content += "<th>$$data</th>".render({data: (datas[index].nome) ? datas[index].nome : "Sem dados"});
					});
					table_content += "<th></th></tr></thead>";
				}else{
                    table_content += '<thead class="datas"><tr><th><th>Nenhum ano preenchido<th></th><th></th></tr></thead>';
                }

				table_content += "<tbody>";

				var indicadores = periods[period_index].indicadores;
				indicadores.sort(function (a, b) {
					a = a.name,
					b = b.name;

					return a.localeCompare(b);
				});
				$.each(indicadores, function(i,item){
					if (item.network_config.unfolded_in_home == 1){
						var tr_class = "unfolded";
					}else{
						var tr_class = "folded";
					}
					table_content += "<tr class='$$tr_class'><td class='nome'><a href='$$url' data-toggle='tooltip' data-placement='right' title data-original-title='$$explanation' class='bs-tooltip'>$$nome</a></td>".render({tr_class: tr_class, nome: item.name, explanation: item.explanation, url:  (window.location.href.slice(-1) == "/") ? item.name_url : window.location.href + "/" + item.name_url});
					if (item.valores.length > 0){

						for (j = 0; j < item.valores.length; j++){
							if (item.valores[j] == "-"){
								table_content += "<td class='valor'>-</td>";
							}else{
                                if (item.variable_type == 'str'){
                                        table_content += "<td class='valor'>$$valor</td>".render({valor: item.valores[j] ? 'OK' : '-' });
                                }else{
									var format_value = parseFloat(item.valores[j]);
									var format_string = "#,##0.##";
									if (format_value.toFixed(2) == 0){
										format_string = "#,##0.###";
									}
                                    table_content += "<td class='valor'>$$valor</td>".render({valor: $.formatNumberCustom(item.valores[j], {format:format_string, locale:"br"})});
                                }
							}
						}
						table_content += "<td class='grafico'><a href='$$url'><canvas id='graph-$$id' width='40' height='20'></canvas></a></td>".render({id: cont, url:  (window.location.href.slice(-1) == "/") ? item.name_url : window.location.href + "/" + item.name_url});

						for (j = 0; j < item.valores.length; j++){
							if (item.valores[j] == "-"){
								item.valores[j] = null;
							}
						}
						graficos[cont] = item.valores;
						cont++;
					}else{
						table_content += "<td class='valor' colspan='20'>-</td>";
					}
				});
				table_content += "</tbody>";
			});
		});

		table_content += "</table>";

		$("#cidades-indicadores .table").append(table_content);

		$(".bs-tooltip").tooltip();

		$("#cidades-indicadores thead.eixos").click(function(){
			$(this).toggleClass("collapsed");
			$(this).nextAll("thead.datas:first").toggle();
			var tbody = $(this).nextAll("tbody:first");
			$(tbody).find("tr.unfolded").removeClass("unfolded").addClass("folded");
			$(tbody).find("tr").toggle();
		});

		geraGraficos();
	}

	function geraGraficos(){
		for (i = 0; i < graficos.length; i++){
			var line = new RGraph.Line('graph-'+i, graficos[i]);
			line.Set('chart.ylabels', false);
			line.Set('chart.noaxes', true);
			line.Set('chart.background.grid', false);
			line.Set('chart.hmargin', 0);
			line.Set('chart.gutter.left', 0);
			line.Set('chart.gutter.right', 0);
			line.Set('chart.gutter.top', 0);
			line.Set('chart.gutter.bottom', 0);
			line.Set('chart.colors', ['#b4b4b4']);
			line.Draw();
		}
	}

    if (ref == "cidade"){
        loadCidadeData();
    }
    if (ref == "region"){
        loadIndicadoresData();
    }

});
