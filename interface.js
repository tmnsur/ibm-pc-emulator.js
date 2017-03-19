/*Copyright (c) 2011-2012 Taner Mansur Redistribution or commercial use is prohibited without the author's permission.*/
function onMemcellChange(event)
{
	var eventTarget = getEventTarget(event);
	var value = eventTarget.target.value;
	
	var result = '';
	var value16 = parseInt(value, 16);
	
	if(isNaN(value16) || value16 > 0xFF || value16 < 0)
	{
		value16 = 0xFF;
	}
	
	if((value16 & 0xFFF0) == 0)
	{
		result += '0';
	}
	
	var pos = parseInt($('mempos').value +  eventTarget.target.id.substring(10, 11) + eventTarget.target.id.substring(8, 9), 16);
	PC.mem[pos] = value16;
	eventTarget.target.value = result + new Number(value16, 16).toString(16).toUpperCase();
	
	if((pos & 0xB800) != 0)
	{
		PC.$8088._refreshConsole();
	}
}

function getPalette(index)
{
	switch(index)
	{
	case 0:
		return '#000000';
	case 1:
		return '#0000AA';
	case 2:
		return '#00AA00';
	case 3:
		return '#00AAAA';
	case 4:
		return '#AA0000';
	case 5:
		return '#AA00AA';
	case 6:
		return '#AA5500';
	case 7:
		return '#AAAAAA';
	case 8:
		return '#555555';
	case 9:
		return '#5555FF';
	case 10:
		return '#55FF55';
	case 11:
		return '#55FFFF';
	case 12:
		return '#FF5555';
	case 13:
		return '#FF55FF';
	case 14:
		return '#FFFF55';
	case 15:
		return '#FFFFFF';
	}
}

PC.$8088._consoleSet = function(row, col, word)
{
	var char = String.fromCharCode(word & 0x00FF);
	var backgroundColor = (word & 0xF000) >>> 12;
	var color = (word & 0x0F00) >>> 8;
	
	$('console').firstChild.childNodes[row].childNodes[col].innerHTML = char;
	$('console').firstChild.childNodes[row].childNodes[col].style.backgroundColor = getPalette(backgroundColor);
	$('console').firstChild.childNodes[row].childNodes[col].style.color = getPalette(color);
};

PC.$8088._refreshConsole = function()
{
	var base = 0xB8000;
	
	for(var i = 0; i < 25; i++)
	{
		for(var j = 0; j < 80; j++)
		{
			var disp = (i * 160) + (j * 2);
			var word = (PC.$8088._readmem(base + disp + 1) << 8) | PC.$8088._readmem(base + disp);
			
			PC.$8088._consoleSet(i, j, word);
		}
	}
};

function createInterface()
{
	var mainTable = createTable([
	                             [[1, 1], [1, 1], [1, 1]],
	                             [[1, 1], [1, 1], [1, 1]],
	                             [[1, 1], [2, 1]],
	                             [[1, 1], [2, 1]],
	                             [[3, 1]]
								]);
	
	var $8088Table = createTable([
	                         [[5, 1], [1, 1], [5, 1], [1, 1], [5, 1]],
	                         [[5, 1], [1, 1], [5, 1], [1, 1], [5, 1]],
	                         [[2, 1], [1, 1], [2, 1], [1, 1], [5, 1], [1, 1], [5, 1]],
	                         [[2, 1], [1, 1], [2, 1], [1, 1], [5, 1], [1, 1], [5, 1]],
	                         [[2, 1], [1, 1], [2, 1], [1, 1], [5, 1], [1, 1], [5, 1]],
	                         [[2, 1], [1, 1], [2, 1], [1, 1], [5, 1], [1, 1], [5, 1]],
	                         [[2, 1], [1, 1], [2, 1], [1, 1], [5, 1], [1, 1], [5, 1]],
	                         [[2, 1], [1, 1], [2, 1], [1, 1], [5, 1], [1, 1], [5, 1]],
	                         [[2, 1], [1, 1], [2, 1], [1, 1], [11, 1]],
	                         [[2, 1], [1, 1], [2, 1], [1, 1], [11, 1]],
	                         [[6, 1], [11, 1]],
	                         [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [11, 1]],
	                         [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [11, 1]],
	                         [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [11, 1]]
	                        ]);
	
	var memMainTable = createTable([
	                                [[1, 1], [1, 1], [1, 1], [1, 1]],
	                                [[4, 1]]
	                               ]);
	
	$8088Table.cellPadding = '2';
	$8088Table.cellSpacing = '2';
	
	var getRegister = function (registerName)
	{
		if(registerName == 'AX')
		{
			return (parseInt($('AH').value, 16) << 8) | parseInt($('AL').value, 16);
		}
		
		if(registerName == 'BX')
		{
			return (parseInt($('BH').value, 16) << 8) | parseInt($('BL').value, 16);
		}

		if(registerName == 'CX')
		{
			return (parseInt($('CH').value, 16) << 8) | parseInt($('CL').value, 16);
		}

		if(registerName == 'DX')
		{
			return (parseInt($('DH').value, 16) << 8) | parseInt($('DL').value, 16);
		}
		
		return parseInt($(registerName).value, 16);
	};
	
	var setRegister = function (registerName, value, bytes)
	{
		var result = PC.$8088._formatHexView(value, bytes * 2);
		
		if(registerName == 'AX')
		{
			$('AL').value = result.substring(2, 4);
			$('AH').value = result.substring(0, 2);
		}
		else if(registerName == 'BX')
		{
			$('BL').value = result.substring(2, 4);
			$('BH').value = result.substring(0, 2);
		}
		else if(registerName == 'CX')
		{
			$('CL').value = result.substring(2, 4);
			$('CH').value = result.substring(0, 2);
		}
		else if(registerName == 'DX')
		{
			$('DL').value = result.substring(2, 4);
			$('DH').value = result.substring(0, 2);
		}
		else
		{
			$(registerName).value = result;
			
			if(registerName == 'IP' || registerName == 'CS')
			{
				$('pc').value = PC.$8088._formatHexView((getRegister('CS') << 4) | getRegister('IP'), 5);
				if(PC.$8088.lastRun == undefined)
				{
					$('disassembly').value = PC._disasm(PC.mem, PC.$8088.getPC(), PC.$8088.getPC() + 256);
				}
			}
		}
	};
	
	var onRegisterChange = function (event)
	{
		var eventTarget = getEventTarget(event);
		setRegister(eventTarget.target.id, parseInt(event.target.value, 16), parseInt($(eventTarget.target.id).maxLength / 2));
	};
	
	PC.$8088.getRegisterGetterSetter = function(getter)
	{		
		if(getter)
		{
			return getRegister;	
		}
		
		return setRegister;
	};
	
	$c($8088Table, 0, 0).innerHTML = 'IP';
	$c($8088Table, 0, 2).innerHTML = 'CS';
	$c($8088Table, 0, 4).innerHTML = 'DI';
	
	$c($8088Table, 1, 0).appendChild(createText('IP', 4));
	$c($8088Table, 1, 0).firstChild.value = '0000';
	$c($8088Table, 1, 0).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getIP = function()
	{
		return getRegister('IP');
	};
	
	PC.$8088.setIP = function(value)
	{
		setRegister('IP', value, 2);
	};
	
	$c($8088Table, 1, 2).appendChild(createText('CS', 4));
	$c($8088Table, 1, 2).firstChild.value = '0000';
	$c($8088Table, 1, 2).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getCS = function()
	{
		return getRegister('CS');
	};
	
	PC.$8088.setCS = function(value)
	{
		setRegister('CS', value, 2);
		$('pc').value = PC.$8088._formatHexView((getRegister('CS') << 4) | getRegister('IP'), 5);
	};
	
	$c($8088Table, 1, 4).appendChild(createText('DI', 4));
	$c($8088Table, 1, 4).firstChild.value = '0000';
	$c($8088Table, 1, 4).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getDI = function()
	{
		return getRegister('DI');
	};
	
	PC.$8088.setDI = function(value)
	{
		setRegister('DI', value, 2);
	};
	
	$c($8088Table, 2, 0).innerHTML = 'AH';
	$c($8088Table, 2, 2).innerHTML = 'AL';
	$c($8088Table, 2, 4).innerHTML = 'DS';
	$c($8088Table, 2, 6).innerHTML = 'SI';
	
	$c($8088Table, 3, 0).appendChild(createText('AH', 2));
	$c($8088Table, 3, 0).firstChild.value = '00';
	$c($8088Table, 3, 0).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getAH = function()
	{
		return getRegister('AH');
	};
	
	PC.$8088.setAH = function(value)
	{
		setRegister('AH', value, 1);
	};
	
	$c($8088Table, 3, 2).appendChild(createText('AL', 2));
	$c($8088Table, 3, 2).firstChild.value = '00';
	$c($8088Table, 3, 2).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getAL = function()
	{
		return getRegister('AL');
	};
	
	PC.$8088.setAL = function(value)
	{
		setRegister('AL', value, 1);
	};
	
	PC.$8088.getAX = function()
	{
		return PC.$8088.getAH() << 8 | PC.$8088.getAL();
	};
	
	PC.$8088.setAX = function(value)
	{
		PC.$8088.setAH((value & 0xFF00) >>> 8);
		PC.$8088.setAL(value & 0x00FF);
	};
	
	$c($8088Table, 3, 4).appendChild(createText('DS', 4));
	$c($8088Table, 3, 4).firstChild.value = '0000';
	$c($8088Table, 3, 4).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getDS = function()
	{
		return getRegister('DS');
	};
	
	PC.$8088.setDS = function(value)
	{
		setRegister('DS', value, 2);
	};
	
	$c($8088Table, 3, 6).appendChild(createText('SI', 4));
	$c($8088Table, 3, 6).firstChild.value = '0000';
	$c($8088Table, 3, 6).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getSI = function()
	{
		return getRegister('SI');
	};
	
	PC.$8088.setSI = function(value)
	{
		setRegister('SI', value, 2);
	};
	
	$c($8088Table, 4, 0).innerHTML = 'BH';
	$c($8088Table, 4, 2).innerHTML = 'BL';
	$c($8088Table, 4, 4).innerHTML = 'SS';
	$c($8088Table, 4, 6).innerHTML = 'BP';
	
	$c($8088Table, 5, 0).appendChild(createText('BH', 2));
	$c($8088Table, 5, 0).firstChild.value = '00';
	$c($8088Table, 5, 0).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getBH = function()
	{
		return getRegister('BH');
	};
	
	PC.$8088.setBH = function(value)
	{
		setRegister('BH', value, 1);
	};
	
	$c($8088Table, 5, 2).appendChild(createText('BL', 2));
	$c($8088Table, 5, 2).firstChild.value = '00';
	$c($8088Table, 5, 2).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getBL = function()
	{
		return getRegister('BL');
	};
	
	PC.$8088.setBL = function(value)
	{
		setRegister('BL', value, 1);
	};
	
	PC.$8088.getBX = function()
	{
		return PC.$8088.getBH() << 8 | PC.$8088.getBL();
	};
	
	PC.$8088.setBX = function(value)
	{
		PC.$8088.setBH((value & 0xFF00) >>> 8);
		PC.$8088.setBL(value & 0x00FF);
	};
	
	$c($8088Table, 5, 4).appendChild(createText('SS', 4));
	$c($8088Table, 5, 4).firstChild.value = '0000';
	$c($8088Table, 5, 4).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getSS = function()
	{
		return getRegister('SS');
	};
	
	PC.$8088.setSS = function(value)
	{
		setRegister('SS', value, 2);
	};
	
	$c($8088Table, 5, 6).appendChild(createText('BP', 4));
	$c($8088Table, 5, 6).firstChild.value = '0000';
	$c($8088Table, 5, 6).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getBP = function()
	{
		return getRegister('BP');
	};
	
	PC.$8088.setBP = function(value)
	{
		setRegister('BP', value, 2);
	};
	
	$c($8088Table, 6, 0).innerHTML = 'CH';
	$c($8088Table, 6, 2).innerHTML = 'CL';
	$c($8088Table, 6, 4).innerHTML = 'ES';
	$c($8088Table, 6, 6).innerHTML = 'SP';
	
	$c($8088Table, 7, 0).appendChild(createText('CH', 2));
	$c($8088Table, 7, 0).firstChild.value = '00';
	$c($8088Table, 7, 0).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getCH = function()
	{
		return getRegister('CH');
	};
	
	PC.$8088.setCH = function(value)
	{
		setRegister('CH', value, 1);
	};
	
	$c($8088Table, 7, 2).appendChild(createText('CL', 2));
	$c($8088Table, 7, 2).firstChild.value = '00';
	$c($8088Table, 7, 2).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getCL = function()
	{
		return getRegister('CL');
	};
	
	PC.$8088.setCL = function(value)
	{
		setRegister('CL', value, 1);
	};
	
	PC.$8088.getCX = function()
	{
		return PC.$8088.getCH() << 8 | PC.$8088.getCL();
	};
	
	PC.$8088.setCX = function(value)
	{
		PC.$8088.setCH((value & 0xFF00) >>> 8);
		PC.$8088.setCL(value & 0x00FF);
	};
	
	$c($8088Table, 7, 4).appendChild(createText('ES', 4));
	$c($8088Table, 7, 4).firstChild.value = '0000';
	$c($8088Table, 7, 4).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getES = function()
	{
		return getRegister('ES');
	};
	
	PC.$8088.setES = function(value)
	{
		setRegister('ES', value, 2);
	};
	
	$c($8088Table, 7, 6).appendChild(createText('SP', 4));
	$c($8088Table, 7, 6).firstChild.value = '0000';
	$c($8088Table, 7, 6).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getSP = function()
	{
		return getRegister('SP');
	};
	
	PC.$8088.setSP = function(value)
	{
		setRegister('SP', value, 2);
	};
	
	$c($8088Table, 8, 0).innerHTML = 'DH';
	$c($8088Table, 8, 2).innerHTML = 'DL';
	
	$c($8088Table, 9, 0).appendChild(createText('DH', 2));
	$c($8088Table, 9, 0).firstChild.value = '00';
	$c($8088Table, 9, 0).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getDH = function()
	{
		return getRegister('DH');
	};
	
	PC.$8088.setDH = function(value)
	{
		setRegister('DH', value, 1);
	};
	
	$c($8088Table, 9, 2).appendChild(createText('DL', 2));
	$c($8088Table, 9, 2).firstChild.value = '00';
	$c($8088Table, 9, 2).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getDL = function()
	{
		return getRegister('DL');
	};
	
	PC.$8088.setDL = function(value)
	{
		setRegister('DL', value, 1);
	};
	
	PC.$8088.getDX = function()
	{
		return PC.$8088.getDH() << 8 | PC.$8088.getDL();
	};
	
	PC.$8088.setDX = function(value)
	{
		PC.$8088.setDH((value & 0xFF00) >>> 8);
		PC.$8088.setDL(value & 0x00FF);
	};
	
	$c($8088Table, 10, 0).innerHTML = 'FLAGS';
	
	$c($8088Table, 11, 0).innerHTML = 'O';
	$c($8088Table, 11, 1).appendChild(createText('O', 1));
	$c($8088Table, 11, 1).firstChild.value = '0';
	$c($8088Table, 11, 1).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getO = function()
	{
		return getRegister('O');
	};
	
	PC.$8088.setO = function(value)
	{
		setRegister('O', value, 0);
	};
	
	$c($8088Table, 11, 2).innerHTML = 'D';
	$c($8088Table, 11, 3).appendChild(createText('D', 1));
	$c($8088Table, 11, 3).firstChild.value = '0';
	$c($8088Table, 11, 3).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getD = function()
	{
		return getRegister('D');
	};
	
	PC.$8088.setD = function(value)
	{
		setRegister('D', value, 0);
	};
	
	$c($8088Table, 11, 4).innerHTML = 'I';
	$c($8088Table, 11, 5).appendChild(createText('I', 1));
	$c($8088Table, 11, 5).firstChild.value = '0';
	$c($8088Table, 11, 5).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getI = function()
	{
		return getRegister('I');
	};
	
	PC.$8088.setI = function(value)
	{
		setRegister('I', value, 0);
	};
	
	$c($8088Table, 12, 0).innerHTML = 'T';
	$c($8088Table, 12, 1).appendChild(createText('T', 1));
	$c($8088Table, 12, 1).firstChild.value = '0';
	$c($8088Table, 12, 1).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getT = function()
	{
		return getRegister('T');
	};
	
	PC.$8088.setT = function(value)
	{
		setRegister('T', value, 0);
	};
	
	$c($8088Table, 12, 2).innerHTML = 'S';
	$c($8088Table, 12, 3).appendChild(createText('S', 1));
	$c($8088Table, 12, 3).firstChild.value = '0';
	$c($8088Table, 12, 3).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getS = function()
	{
		return getRegister('S');
	};
	
	PC.$8088.setS = function(value)
	{
		setRegister('S', value, 0);
	};
	
	$c($8088Table, 12, 4).innerHTML = 'Z';
	$c($8088Table, 12, 5).appendChild(createText('Z', 1));
	$c($8088Table, 12, 5).firstChild.value = '1';
	$c($8088Table, 12, 5).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getZ = function()
	{
		return getRegister('Z');
	};
	
	PC.$8088.setZ = function(value)
	{
		setRegister('Z', value, 0);
	};
	
	$c($8088Table, 13, 0).innerHTML = 'A';
	$c($8088Table, 13, 1).appendChild(createText('A', 1));
	$c($8088Table, 13, 1).firstChild.value = '0';
	$c($8088Table, 13, 1).firstChild.onchange = onRegisterChange;

	PC.$8088.getA = function()
	{
		return getRegister('A');
	};
	
	PC.$8088.setA = function(value)
	{
		setRegister('A', value, 0);
	};
	
	$c($8088Table, 13, 2).innerHTML = 'P';
	$c($8088Table, 13, 3).appendChild(createText('P', 1));
	$c($8088Table, 13, 3).firstChild.value = '0';
	$c($8088Table, 13, 3).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getP = function()
	{
		return getRegister('P');
	};
	
	PC.$8088.setP = function(value)
	{
		setRegister('P', value, 0);
	};
	
	$c($8088Table, 13, 4).innerHTML = 'C';
	$c($8088Table, 13, 5).appendChild(createText('C', 1));
	$c($8088Table, 13, 5).firstChild.value = '0';
	$c($8088Table, 13, 5).firstChild.onchange = onRegisterChange;
	
	PC.$8088.getC = function()
	{
		return getRegister('C');
	};
	
	PC.$8088.setC = function(value)
	{
		setRegister('C', value, 0);
	};

	$c(mainTable, 0, 0).innerHTML = '8088';
	$c(mainTable, 0, 0).style.fontWeight = 'bold';
	$c(mainTable, 1, 0).appendChild($8088Table);
	
	var memTable = createTable();
	memTable.id = 'memtable';
	
	for(var i = 0; i < 17; i++)
	{
		var tr = $_('tr');
		
		for(var j = 0; j < 17; j++)
		{
			var td = $_('td');
			
			if(i == 0)
			{
				if(j != 0)
				{
					td.innerHTML = 'x' + new Number(j - 1).toString(16).toUpperCase();
				}
			}
			else if(j == 0)
			{
				if(i != 0)
				{
					td.innerHTML = new Number(i - 1).toString(16).toUpperCase() + 'x';
				}
			}
			else
			{
				td.appendChild(createText('memcell_' + new Number(j - 1).toString(16) + '_' + new Number(i - 1).toString(16), 2));
				td.firstChild.value = '00';
				td.firstChild.onchange = onMemcellChange;
			}
			
			tr.appendChild(td);
		}
		
		memTable.firstChild.appendChild(tr);		
	}
	
	PC.$8088._updateMemView = function (ea)
	{
		var base = parseInt($('mempos').value, 16) << 8;
		var isInSamePos = ((ea & 0xFFF00) == base);
		var table = $('memtable');
		
		if(isInSamePos)
		{
			var value = PC.mem[ea];
			var row = (ea & 0xF0) >>> 4;
			var col = (ea & 0x0F);
			
			table.firstChild.childNodes[row + 1].childNodes[col + 1].firstChild.value = PC.$8088._formatHexView(value, 2);
		}
	};
	
	PC.$8088._updateMemSegment = function (segment)
	{
		var base = parseInt($('mempos').value, 16) << 8;
		var table = $('memtable');
		
		if(segment == base)
		{
			for(var row = 0; row < 16; row++)
			{
				for(var col = 0; col < 16; col++)
				{
					var value = PC.mem[segment | (row << 4) | col];
					table.firstChild.childNodes[row + 1].childNodes[col + 1].firstChild.value = PC.$8088._formatHexView(value, 2);
				}
			}
		}
	};
	
	PC.$8088._showMemSegment = function ()
	{
		PC.$8088._updateMemSegment(parseInt($('mempos').value, 16) << 8);
	};
	
	PC.$8088._incMemSegment = function ()
	{
		setMemPos(parseInt($('mempos').value, 16) + 1);
		PC.$8088._showMemSegment();
	};
	
	PC.$8088._decMemSegment = function ()
	{
		setMemPos(parseInt($('mempos').value, 16) - 1);
		PC.$8088._showMemSegment();
	};
	
	$c(mainTable, 0, 1).innerHTML = 'Memory';
	$c(mainTable, 0, 1).style.fontWeight = 'bold';
	
	$c(memMainTable, 0, 0).style.textAlign = 'left';
	$c(memMainTable, 0, 0).appendChild(createText('mempos', 3));
	$c(memMainTable, 0, 0).innerHTML = 'Segment ' + $c(memMainTable, 0, 0).innerHTML;
	$c(memMainTable, 0, 0).innerHTML = $c(memMainTable, 0, 0).innerHTML + ' xx';
	$c(memMainTable, 0, 1).style.textAlign = 'center';
	$c(memMainTable, 0, 1).appendChild(createText('pc', 5));
	$c(memMainTable, 0, 1).firstChild.readOnly = 'true';
	$c(memMainTable, 0, 1).innerHTML = 'PC ' + $c(memMainTable, 0, 1).innerHTML;
	$c(memMainTable, 0, 3).style.textAlign = 'right';
	$c(memMainTable, 0, 3).appendChild(createButton('setmemprev', 'Prev', PC.$8088._decMemSegment));
	$c(memMainTable, 0, 3).appendChild(createButton('setmemnext', 'Next', PC.$8088._incMemSegment));
	$c(memMainTable, 1, 0).appendChild(memTable);
	
	$c(mainTable, 0, 2).innerHTML = 'Disassembly';
	$c(mainTable, 0, 2).style.fontWeight = 'bold';
	var disassembly = $_('textarea');
	disassembly.id = 'disassembly';
	disassembly.cols = '50';
	disassembly.rows = '25';
	disassembly.readOnly = 'true';
	disassembly.style.resize = 'none';
	disassembly.style.fontFamily = 'monospace';
	disassembly.style.fontSize = '12px';
	$c(mainTable, 1, 2).appendChild(disassembly);
	
	$c(mainTable, 1, 1).appendChild(memMainTable);
	$c(mainTable, 2, 0).style.textAlign = 'left';
	$c(mainTable, 2, 0).appendChild(createButton('step', 'Step', PC.$8088._step));
	$c(mainTable, 2, 0).appendChild(createButton('run', 'Run', PC.$8088._run));
	
	var sel = document.createElement('select');
	var op0 = document.createElement('option');
	var op1 = document.createElement('option');
	var op2 = document.createElement('option');
	var op3 = document.createElement('option');
	sel.id = 'speed';
	op0.key = '1';
	op0.value = '1 ips';
	op0.innerHTML = '1 ips';;
	op1.key = '10';
	op1.value = '10 ips';
	op1.innerHTML = '10 ips';;
	op2.key = '100';
	op2.value = '100 ips';
	op2.innerHTML = '100 ips';;
	op3.key = '1000';
	op3.value = '1000 ips';
	op3.innerHTML = '1000 ips';;
	
	sel.appendChild(op0);
	sel.appendChild(op1);
	sel.appendChild(op2);
	sel.appendChild(op3);
	
	sel.onchange = function(event)
	{
		PC.speed = 1000 / parseInt($('speed').value);
		
		if(PC.$8088.lastRun != undefined)
		{
			PC.$8088._stop();
			PC.$8088._run();
		}
	}
	
	$c(mainTable, 2, 0).appendChild(sel);
	$c(mainTable, 2, 0).appendChild(createButton('stop', 'Stop', PC.$8088._stop));
	
	var memFileInput = document.createElement('input');
	memFileInput.type = 'file';
	memFileInput.onchange = function(event)
	{
		var eventTarget = getEventTarget(event);
		var reader = new FileReader();
		
		reader.onloadend = function(event)
		{
			var eventTarget = getEventTarget(event);
			if(eventTarget.target.error)
			{
				throw eventTarget.target.error;
			}
			else
			{
				PC.mem = new Uint8Array(reader.result);
				PC.$8088._showMemSegment();
				PC.$8088._refreshConsole();
				$('disassembly').value = PC._disasm(PC.mem, PC.$8088.getPC(), PC.$8088.getPC() + 256);
			}
		};
		
		reader.readAsArrayBuffer(eventTarget.target.files[0]);
	};
	
	$c(mainTable, 2, 1).appendChild(document.createElement('span'));
	$c(mainTable, 2, 1).lastChild.innerHTML = 'Load Memory Dump File (1MB) : ';
	$c(mainTable, 2, 1).appendChild(memFileInput);
	
	var binFileInput = document.createElement('input');
	binFileInput.type = 'file';
	binFileInput.onchange = function(event)
	{
		var eventTarget = getEventTarget(event);
		var reader = new FileReader();
		
		reader.onloadend = function(event)
		{
			var eventTarget = getEventTarget(event);
			if(eventTarget.target.error)
			{
				throw eventTarget.target.error;
			}
			else
			{
				var pa = (PC.$8088.getCS() << 4) | PC.$8088.getIP();
				PC.$8088._writememarr(pa, new Uint8Array(reader.result));
				PC.$8088._showMemSegment();
				PC.$8088._refreshConsole();
				$('disassembly').value = PC._disasm(PC.mem, PC.$8088.getPC(), PC.$8088.getPC() + 256);				
			}
		};
		
		reader.readAsArrayBuffer(eventTarget.target.files[0]);
	};
	
	$c(mainTable, 3, 1).appendChild(document.createElement('span'));
	$c(mainTable, 3, 1).lastChild.innerHTML = 'Load Binary File into current CS:IP : ';
	$c(mainTable, 3, 1).appendChild(binFileInput);
	
	var console = createTable();
	console.id = 'console';
	console.style.fontSize = '12px';
	console.style.fontFamily = 'monospace';
	
	for(var i = 0; i < 25; i++)
	{
		var row = $_('tr');
		
		for(var j = 0; j < 80; j++)
		{
			var col = $_('td');
			col.style.width = '1em';
			col.style.height = '1em';
			row.appendChild(col);
		}
		
		console.firstChild.appendChild(row);
	}
	
	$c(mainTable, 4, 0).style.textAlign = 'center';
	$c(mainTable, 4, 0).style.margin = 'auto';
	$c(mainTable, 4, 0).appendChild(console);
	
	mainTable.border = 1;
	mainTable.cellPadding = '10';
	
	document.body.appendChild(mainTable);
	
	$('mempos').value = '000';
	$('pc').value = 'FFFF0';
	
	var setMemPos = function(value)
	{
		if(isNaN(value))
		{
			value = 0;
		}
		
		$('mempos').value = PC.$8088._formatHexView(value, 3);
	};
	
	$('mempos').onchange = function (event)
	{
		var eventTarget = getEventTarget(event);
		var value = eventTarget.target.value;
		
		setMemPos(parseInt(value, 16));
		PC.$8088._showMemSegment();
		PC.$8088._refreshConsole();
		$('disassembly').value = PC._disasm(PC.mem, PC.$8088.getPC(), PC.$8088.getPC() + 256);
	};
};

PC.$8088.getPC = function()
{
	return parseInt($('pc').value, 16);
};

function main()
{
	createInterface();
	PC.mem = ibmpc_memdump;
	PC.$8088.setIP(0xFFF0);
	PC.$8088.setCS(0xF000);
	$('mempos').value = 'FFF';
	PC.$8088._showMemSegment();
	PC.$8088._refreshConsole();
}
