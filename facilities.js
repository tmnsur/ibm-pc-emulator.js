/*Copyright (c) 2011-2012 Taner Mansur Redistribution or commercial use is prohibited without the author's permission.*/
var PC = {};
PC.MAX_ADDRESS = 1048575;
PC.MAX_PORT = 65536;
PC.$8088 = {};
PC.mem = [];
PC.port = [];
PC.isRunning = false;

PC.regs = {};
PC.speed = 1000;

PC.$8088.insCycles = {'aaa' : 8, 'aad' : 60, 'aam' : 83, 'aas' : 8, 'cbw' : 2, 'clc' : 2, 'cld' : 2, 'cli' : 2, 'cmc' : 2, 'cmps' : 22, 'cwd' : 5, 'daa' : 4, 'das' : 4, 'esc' : 2, 'hlt' : 2};

PC.$8088._initMem = function ()
{
	for(var i = 0; i <= PC.MAX_ADDRESS; i++)
	{
		PC.mem[i] = 0;
	}
};

PC.$8088._initPort = function ()
{
	for(var i = 0; i <= PC.MAX_PORT; i++)
	{
		PC.port[i] = 0;
	}
};

PC.$8088._initMem();

PC.$8088._increaseIP = function ()
{
	PC.$8088.setIP(PC.$8088.getIP() + 1);
};

PC.$8088._fetchNextInstructionByte = function ()
{
	var result = PC.$8088._readmem(PC.$8088.getCS() << 4 | PC.$8088.getIP());
	PC.$8088._increaseIP();
	return result;
};

PC.$8088._readmem = function (pa, w)
{
	if(pa < 0 || pa + w < 0 || pa + w > PC.MAX_ADDRESS)
	{
		throw "Unable to read mem " + new Number(pa).toString(16).toUpperCase() + " w " + w;
	}
	
	var cnt = (w == undefined) ? 0 : w;
	var value = PC.mem[pa];
	var index = 0;
	while(cnt != 0)
	{
		index++;
		value = (PC.mem[pa + index] << 8) | value;
		cnt = cnt - 1;
	}
	
	return value;
};

PC.$8088._writememarr = function (pa, arr)
{
	var counter = 0;
	
	while(counter < arr.length)
	{
		if(pa + counter < 0 || pa + counter > PC.MAX_ADDRESS)
		{
			throw "Unable to write mem " + new Number(pa + counter).toString(16).toUpperCase();
		}
		
		var pos = pa + counter;
		PC.mem[pos] = arr[counter];
		
		if((pos & 0xB800) != 0)
		{
			PC.$8088._refreshConsole();		
		}
		
		counter++;
	}
};

PC.$8088._writemem = function (pa, value, bytes)
{
	var counter = 0;
	var mask = 0xFF;
	
	while(counter < bytes)
	{
		if(pa + counter < 0 || pa + counter > PC.MAX_ADDRESS)
		{
			throw "Unable to write mem " + new Number(pa + counter).toString(16).toUpperCase();
		}
		
		PC.mem[pa + counter] = ((value & mask) >> (counter * 8));
		PC.$8088._updateMemView(pa + counter);
		counter++;
		mask = (mask << (counter * 8));
	}
};

PC.$8088.getPortValue = function (port)
{
	if(port < 0 || port > PC.MAX_PORT)
	{
		throw "Unable to read port " + new Number(port).toString(16).toUpperCase();
	}
	
	return PC.port[port];
};

PC.$8088.setPortValue = function (port, value, bytes)
{
	var counter = 0;
	var mask = 0xFF;
	
	while(counter < bytes)
	{
		if(port + counter < 0 || port + counter > PC.MAX_PORT)
		{
			throw "Unable to write port " + new Number(port + counter).toString(16).toUpperCase();
		}
		
		PC.mem[port + counter] = ((value & mask) >> (counter * 8));
		PC.$8088._updateMemView(port + counter);
		counter++;
		mask = (mask << (counter * 8));
	}
	
	PC.port[port] = value;
};

PC.$8088._formatHexView = function (value, nibbles)
{
	if(nibbles == 0)
	{
		return new Number(value).toString(16).toUpperCase();
	}
	
	var result = '';
	var limit = 0xF;
	
	if(nibbles > 8 || nibbles < 0)
	{
		nibbles = 8;
	}
	
	for(var i = 0; i < nibbles - 1; i++)
	{
		limit = (limit << 4) | 0xF;
	}
	
	if(isNaN(value))
	{
		value = limit;
	}
	else if(value < 0)
	{
		var increment = 1;
		
		for(var i = 0; i < nibbles; i++)
		{
			increment = increment << 4;
		}
		
		value = value + increment;
	}
	
	if(value > limit)
	{
		value = (value % limit) - 1;
	}
	
	var mask = 0xF << ((nibbles - 1) * 4);
	
	while(mask != 0)
	{
		if((value & mask) != 0)
		{
			break;
		}
		
		result += '0';
		mask = mask >>> 4; 
	}
	
	return value == 0 ? result : result + new Number(value).toString(16).toUpperCase();
};

PC.$8088._decodeReg = function(reg, w)
{
	switch(reg)
	{
	case 0:
		return w == 0 ? 'AL' : 'AX';
	case 1:
		return w == 0 ? 'CL' : 'CX';
	case 2:
		return w == 0 ? 'DL' : 'DX';
	case 3:
		return w == 0 ? 'BL' : 'BX';
	case 4:
		return w == 0 ? 'AH' : 'SP';
	case 5:
		return w == 0 ? 'CH' : 'BP';
	case 6:
		return w == 0 ? 'DH' : 'SI';
	case 7:
		return w == 0 ? 'BH' : 'DI';
	default:
		throw "Unable to decode reg";
	}
};

PC.$8088._decodeSr = function(sr)
{
	switch(sr)
	{
	case 0:
		return 'ES';
	case 1:
		return 'CS';
	case 2:
		return 'SS';
	case 3:
		return 'DS';
	default:
		throw "Unable to decode sr";
	}
};

PC.$8088._calculatePA = function (mod, rm)
{
	var pa = 0;
	var seg = (PC.$8088._sop == undefined) ? PC.$8088.getDS() : PC.$8088.getRegisterGetterSetter(true)(PC.$8088._sop);
	
	switch(rm)
	{
	case 0:
		pa = (seg << 4) + PC.$8088.getBX() + PC.$8088.getSI();
		break;
	case 1:
		pa = (seg << 4) + PC.$8088.getBX() + PC.$8088.getDI();
		break;
	case 2:
		pa = (PC.$8088.getSS() << 4) + PC.$8088.getBP() + PC.$8088.getSI();
		break;
	case 3:
		pa = (PC.$8088.getSS() << 4) + PC.$8088.getBP() + PC.$8088.getDI();
		break;
	case 4:
		pa = (seg << 4) + PC.$8088.getSI();
		break;
	case 6:
		if(mod != 0)
		{
			pa = (PC.$8088.getSS() << 4) + PC.$8088.getBP();
		}
	case 5:
		pa = (seg << 4) + PC.$8088.getDI();
		break;
	case 7:
		pa = (seg << 4) + PC.$8088.getBX();
		break;
	}
	
	switch(mod)
	{
	case 0:
		if(rm == 6)
		{
			var lo = PC.$8088._fetchNextInstructionByte();
			pa = (seg << 4) + ((PC.$8088._fetchNextInstructionByte() << 8) | lo);
		}
		break;
	case 1:
		pa += PC.$8088._fetchNextInstructionByte();
		break;
	case 2:
		var lo = PC.$8088._fetchNextInstructionByte();
		pa += (PC.$8088._fetchNextInstructionByte() << 8) | lo;
		break;
	}
	
	return pa;
};

PC.$8088._calculateEA = function (mod, rm)
{
	var ea = 0;
	
	switch(rm)
	{
	case 0:
		ea = PC.$8088.getBX() + PC.$8088.getSI();
		break;
	case 1:
		ea = PC.$8088.getBX() + PC.$8088.getDI();
		break;
	case 2:
		ea = PC.$8088.getBP() + PC.$8088.getSI();
		break;
	case 3:
		ea = PC.$8088.getBP() + PC.$8088.getDI();
		break;
	case 4:
		ea = PC.$8088.getSI();
		break;
	case 6:
		if(mod != 0)
		{
			ea = PC.$8088.getBP();
		}
	case 5:
		ea = PC.$8088.getDI();
		break;
	case 7:
		ea = PC.$8088.getBX();
		break;
	}
	
	switch(mod)
	{
	case 0:
		if(rm == 6)
		{
			var lo = PC.$8088._fetchNextInstructionByte();
			ea = (PC.$8088._fetchNextInstructionByte() << 8) | lo;
		}
		break;
	case 1:
		ea += PC.$8088._fetchNextInstructionByte();
		break;
	case 2:
		var lo = PC.$8088._fetchNextInstructionByte();
		ea += (PC.$8088._fetchNextInstructionByte() << 8) | lo;
		break;
	}
	
	return ea;
};

PC.$8088._prepareInstruction = function ()
{
	var opcode = PC.$8088._fetchNextInstructionByte();
	var instruction;
	var extraBytes = new Array();
	
	switch(opcode)
	{
	case 0x00: case 0x01: case 0x02: case 0x03:
		instruction = PC.$8088.add0;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x04: case 0x05:
		instruction = PC.$8088.add2;
		break;
	case 0x06: case 0x0E: case 0x16: case 0x1E:
		instruction = PC.$8088.push2;
		break;
	case 0x07: case 0x0F: case 0x17: case 0x1F:
		instruction = PC.$8088.pop2;
		break;
	case 0x08: case 0x09: case 0x0A: case 0x0B:
		instruction = PC.$8088.or0;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x0C: case 0x0D:
		instruction = PC.$8088.or2;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x10: case 0x11: case 0x12: case 0x13:
		instruction = PC.$8088.adc0;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x14: case 0x15:
		instruction = PC.$8088.adc2;
		break;
	case 0x18: case 0x19: case 0x1A: case 0x1B:
		instruction = PC.$8088.sbb0;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x1C: case 0x1D:
		instruction = PC.$8088.sbb2;
		break;
	case 0x20: case 0x21: case 0x22: case 0x23:
		instruction = PC.$8088.and0;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x24: case 0x25:
		instruction = PC.$8088.and2;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x26:
		instruction = PC.$8088.segES;
		break;
	case 0x27:
		instruction = PC.$8088.daa;
		break;
	case 0x28: case 0x29: case 0x2A: case 0x2B:
		instruction = PC.$8088.sub0;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x2C: case 0x2D:
		instruction = PC.$8088.sub2;
		break;
	case 0x2E:
		instruction = PC.$8088.segCS;
		break;
	case 0x2F:
		instruction = PC.$8088.das;
		break;
	case 0x30: case 0x31: case 0x32: case 0x33:
		instruction = PC.$8088.xor0;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x34: case 0x35:
		instruction = PC.$8088.xor2;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x36:
		instruction = PC.$8088.segSS;
		break;
	case 0x37:
		instruction = PC.$8088.aaa;
		break;
	case 0x38: case 0x39: case 0x3A: case 0x3B:
		instruction = PC.$8088.cmp0;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x3C: case 0x3D:
		instruction = PC.$8088.cmp2;
		break;
	case 0x3E:
		instruction = PC.$8088.segDS;
		break;
	case 0x3F:
		instruction = PC.$8088.aas;
		break;
	case 0x40: case 0x41: case 0x42: case 0x43: case 0x44: case 0x45: case 0x46: case 0x47:
		instruction = PC.$8088.inc1;
		break;
	case 0x48: case 0x49: case 0x4A: case 0x4B: case 0x4C: case 0x4D: case 0x4E: case 0x4F:
		instruction = PC.$8088.dec1;
		break;
	case 0x50: case 0x51: case 0x52: case 0x53: case 0x54: case 0x55: case 0x56: case 0x57:
		instruction = PC.$8088.push1;
		break;
	case 0x58: case 0x59: case 0x5A: case 0x5B: case 0x5C: case 0x5D: case 0x5E: case 0x5F:
		instruction = PC.$8088.pop1;
		break;
	case 0x70:
		instruction = PC.$8088.jo;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x71:
		instruction = PC.$8088.jno;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x72:
		instruction = PC.$8088.jb;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x73:
		instruction = PC.$8088.jnb;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x74:
		instruction = PC.$8088.je;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x75:
		instruction = PC.$8088.jne;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x76:
		instruction = PC.$8088.jbe;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x77:
		instruction = PC.$8088.jnbe;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x78:
		instruction = PC.$8088.js;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x79:
		instruction = PC.$8088.jns;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x7A:
		instruction = PC.$8088.jp;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x7B:
		instruction = PC.$8088.jnp;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x7C:
		instruction = PC.$8088.jl;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x7D:
		instruction = PC.$8088.jnl;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x7E:
		instruction = PC.$8088.jle;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x7F:
		instruction = PC.$8088.jnle;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x80: case 0x81:
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		
		var reg = (extraBytes[0] & 0x38) >> 3;
		
		switch(reg)
		{
		case 0:
			instruction = PC.$8088.add1;
			break;
		case 1:
			instruction = PC.$8088.or1;
			break;
		case 2:
			instruction = PC.$8088.adc1;
			break;
		case 3:
			instruction = PC.$8088.sbb1;
			break;
		case 4:
			instruction = PC.$8088.and1;
			break;
		case 5:
			instruction = PC.$8088.sub1;
			break;
		case 6:
			instruction = PC.$8088.xor1;
			break;
		case 7:
			instruction = PC.$8088.cmp1;
			break;
		default:
			throw "Unable to decode reg " + new Number(reg).toString(16).toUpperCase();
		}
		break;
	case 0x82: case 0x83:
		instruction = PC.$8088.add1;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x84: case 0x85:
		instruction = PC.$8088.test0;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x86: case 0x87:
		instruction = PC.$8088.xchg0;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x88: case 0x89: case 0x8A: case 0x8B:
		instruction = PC.$8088.mov0;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x8C:
		instruction = PC.$8088.mov6;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x8D:
		instruction = PC.$8088.lea;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x8E:
		instruction = PC.$8088.mov5;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x8F:
		instruction = PC.$8088.pop0;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x90: case 0x91: case 0x92: case 0x93: case 0x94: case 0x95: case 0x96: case 0x97:
		instruction = PC.$8088.xchg1;
		break;
	case 0x98:
		instruction = PC.$8088.cbw;
		break;
	case 0x99:
		instruction = PC.$8088.cwd;
		break;
	case 0x9A:
		instruction = PC.$8088.call2;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0x9B:
		instruction = PC.$8088.wait;
		break;
	case 0x9C:
		instruction = PC.$8088.pushf;
		break;
	case 0x9D:
		instruction = PC.$8088.popf;
		break;
	case 0x9E:
		instruction = PC.$8088.sahf;
		break;
	case 0x9F:
		instruction = PC.$8088.lahf;
		break;
	case 0xA0: case 0xA1:
		instruction = PC.$8088.mov3;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xA2: case 0xA3:
		instruction = PC.$8088.mov4;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xA4: case 0xA5:
		instruction = PC.$8088.movs;
		break;
	case 0xA6: case 0xA7:
		instruction = PC.$8088.cmps;
		break;
	case 0xA8: case 0xA9:
		instruction = PC.$8088.test2;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xAA: case 0xAB:
		instruction = PC.$8088.stds;
		break;
	case 0xAC: case 0xAD:
		instruction = PC.$8088.lods;
		break;
	case 0xAE: case 0xAF:
		instruction = PC.$8088.scas;
		break;
	case 0xB0: case 0xB1: case 0xB2: case 0xB3: case 0xB4: case 0xB5: case 0xB6: case 0xB7: case 0xB8: case 0xB9: case 0xBA: case 0xBB: case 0xBC: case 0xBD: case 0xBE: case 0xBF:
		instruction = PC.$8088.mov2;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xC0: case 0xC1:
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		switch((extraBytes[0] & 0x38) >> 6)
		{
		case 0:
			instruction = PC.$8088.rol;
			break;
		case 1:
			instruction = PC.$8088.ror;
			break;
		case 2:
			instruction = PC.$8088.rcl;
			break;
		case 3:
			instruction = PC.$8088.rcr;
			break;
		case 4:
			instruction = PC.$8088.sal;
			break;
		case 5:
			instruction = PC.$8088.shr;
			break;
		case 6:
			instruction = PC.$8088.rcl;
			break;
		case 7:
			instruction = PC.$8088.sar;
			break;
		}
		break;
	case 0xC2:
		instruction = PC.$8088.ret1;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xC3:
		instruction = PC.$8088.ret0;
		break;
	case 0xC4:
		instruction = PC.$8088.les;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xC5:
		instruction = PC.$8088.lds;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xC6: case 0xC7:
		instruction = PC.$8088.mov1;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xCC:
		instruction = PC.$8088.int1;
		break;
	case 0xCD:
		instruction = PC.$8088.int0;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xCE:
		instruction = PC.$8088.into;
		break;
	case 0xCF:
		instruction = PC.$8088.iret;
		break;
	case 0xD0: case 0xD1: case 0xD2: case 0xD3:
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		
		var reg = (extraBytes[0] & 0x38) >> 3;
		
		switch(reg)
		{
		case 0:
			instruction = PC.$8088.rol;
			break;
		case 1:
			instruction = PC.$8088.ror;
			break;
		case 2:
			instruction = PC.$8088.rcl;
			break;
		case 3:
			instruction = PC.$8088.rcr;
			break;
		case 4:
			instruction = PC.$8088.sal;
			break;
		case 5:
			instruction = PC.$8088.shr;
			break;
		case 7:
			instruction = PC.$8088.sar;
			break;
		default:
			throw "Unable to decode reg " + new Number(reg).toString(16).toUpperCase();
		}
		break;
	case 0xD4:
		instruction = PC.$8088.aam;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xD5:
		instruction = PC.$8088.aad;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xD7:
		instruction = PC.$8088.xlat;
		break;
	case 0xDA:
		instruction = PC.$8088.ret3;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xDB:
		instruction = PC.$8088.ret2;
		break;
	case 0xE0:
		instruction = PC.$8088.loopnz;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xE1:
		instruction = PC.$8088.loopz;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xE2:
		instruction = PC.$8088.loop;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xE3:
		instruction = PC.$8088.jcxz;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xE4: case 0xE5:
		instruction = PC.$8088.in0;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xE6: case 0xE7:
		instruction = PC.$8088.out0;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xE8:
		instruction = PC.$8088.call0;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xE9:
		instruction = PC.$8088.jmp0;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xEA:
		instruction = PC.$8088.jmp3;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xEB:
		instruction = PC.$8088.jmp1;
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		break;
	case 0xEC: case 0xED:
		instruction = PC.$8088.in1;
		break;
	case 0xEE: case 0xEF:
		instruction = PC.$8088.out1;
		break;
	case 0xF0:
		instruction = PC.$8088.lock;
		break;
	case 0xF2:
		instruction = PC.$8088.rep0;
		break;
	case 0xF3:
		instruction = PC.$8088.rep1;
		break;
	case 0xF4:
		instruction = PC.$8088.hlt;
		break;
	case 0xF5:
		instruction = PC.$8088.cmc;
		break;
	case 0xF6: case 0xF7:
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		
		var reg = (extraBytes[0] & 0x38) >> 3;
		
		switch(reg)
		{
		case 0:
			instruction = PC.$8088.test1;
			break;
		case 2:
			instruction = PC.$8088.not;
			break;
		case 3:
			instruction = PC.$8088.neg;
			break;
		case 4:
			instruction = PC.$8088.mul;
			break;
		case 5:
			instruction = PC.$8088.imul;
			break;
		case 6:
			instruction = PC.$8088.div;
			break;
		case 7:
			instruction = PC.$8088.idiv;
			break;
		default:
			throw "Unable to decode reg " + new Number(reg).toString(16).toUpperCase();
		}
		break;
	case 0xF8:
		instruction = PC.$8088.clc;
		break;
	case 0xF9:
		instruction = PC.$8088.stc;
		break;
	case 0xFA:
		instruction = PC.$8088.cli;
		break;
	case 0xFB:
		instruction = PC.$8088.sti;
		break;
	case 0xFC:
		instruction = PC.$8088.cld;
		break;
	case 0xFD:
		instruction = PC.$8088.std;
		break;
	case 0xFE:
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		
		var reg = (extraBytes[0] & 0x38) >> 3;
		
		switch(reg)
		{
		case 0:
			instruction = PC.$8088.inc0;
			break;
		case 1:
			instruction = PC.$8088.dec0;
			break;
		default:
			throw "Unable to decode reg " + new Number(reg).toString(16).toUpperCase();
		}
		break;
	case 0xFF:
		extraBytes.push(PC.$8088._fetchNextInstructionByte());
		
		var reg = (extraBytes[0] & 0x38) >> 3;
		
		switch(reg)
		{
		case 0:
			instruction = PC.$8088.inc0;
			break;
		case 1:
			instruction = PC.$8088.dec0;
			break;
		case 2:
			instruction = PC.$8088.call1;
			break;
		case 3:
			instruction = PC.$8088.call3;
			break;
		case 4:
			instruction = PC.$8088.jmp2;
			break;
		case 5:
			instruction = PC.$8088.jmp4;
			break;
		case 6:
			instruction = PC.$8088.push0;
			break;
		default:
			throw "Unable to decode reg " + new Number(reg).toString(16).toUpperCase();
		}
		
		break;
	default:
		throw "Unable to decode opcode " + new Number(opcode, 16).toString(16).toUpperCase();
	}
	
	return [instruction, opcode, extraBytes];
};

PC.$8088._disasmcurrentmempos = function()
{
	var ip = PC.$8088.getIP();
	var cs = PC.$8088.getCS();
	
	var ins = PC.$8088._prepareInstruction();
	
	PC.$8088.setIP(ip);
	PC.$8088.setCS(cs);
};

PC.$8088._step = function()
{
	var ins = PC.$8088._prepareInstruction();
	var opcode = ins[1];
	var extraBytes = ins[2];
	
	ins[0](opcode, extraBytes);
	
	if(extraBytes.length == 0 && opcode != 0x26 && opcode != 0x2E && opcode != 0x36 && opcode != 0x3E)
	{
		PC.$8088._sop = undefined;
	}
};

PC.$8088._getCycles = function(ins)
{
	return 2;
};

PC.$8088._instructionLoop = function()
{
	PC.$8088._step();
	
	if(PC.$8088.lastRun != undefined)
	{
		PC.$8088.lastRun = setTimeout('PC.$8088._instructionLoop()', PC.speed);
	}
};

PC.$8088._run = function()
{
	PC.$8088.lastRun = 0;
	$('disassembly').value = '';
	setTimeout('PC.$8088._instructionLoop()');
};

PC.$8088._stop = function()
{
	$('disassembly').value = PC._disasm(PC.mem, PC.$8088.getPC(), PC.$8088.getPC() + 256);
	clearTimeout(PC.$8088.lastRun);
	PC.$8088.lastRun = undefined;
};

PC.$8088._calculateParityFlag = function(value)
{
	var result = value ^ (value >> 4);
	
	result = result ^ (result >> 2);
	result = result ^ (result >> 1);
	
	PC.$8088.setP((result & 1) == 0 ? 1 : 0);
};

PC.$8088._calculateZeroFlag = function(w, value)
{
	if(w == 0)
	{
		PC.$8088.setZ((value & 0xFF) == 0 ? 1 : 0);
	}
	else
	{
		PC.$8088.setZ((value & 0xFFFF) == 0 ? 1 : 0);
	}
};

PC.$8088._calculateSignFlag = function(w, value)
{
	if(w == 0)
	{
		PC.$8088.setS((value & 0x80) == 0 ? 0 : 1);
	}
	else
	{
		PC.$8088.setS((value & 0x8000) == 0 ? 0 : 1);
	}
};

PC.$8088._calculateCarryFlag = function(w, value)
{
	if(w == 0)
	{
		PC.$8088.setC((value & 0x0100) > 0 ? 1 : 0);
	}
	else
	{
		PC.$8088.setC((value & 0x10000) > 0 ? 1 : 0);
	}
};

PC.$8088._calculateAdjustFlag = function(operand0, operand1, result)
{
	PC.$8088.setA((((operand0 ^ operand1) ^ result) & 0x10) > 0 ? 1 : 0);
};

PC.$8088._calculateOverflowFlag = function(w, operand0, operand1, result)
{
	var result = ((operand0 ^ (~ operand1)) & (operand0 ^ operand1));
	if(w == 0)
	{
		PC.$8088.setO((result & 0x80) > 0 ? 1 : 0);
	}
	else
	{
		PC.$8088.setO((result & 0x8000) > 0 ? 1 : 0);
	}
};

PC.$8088.performALUOperation = function(opid, optype, opcode, extraBytes)
{
	var d = (opcode & 0x02) >> 1;
	var w = opcode & 0x01;
	var mod;
	var reg;
	var rm;
	var src;
	var dst;
	var srcValue;
	var dstValue;
	var repeatCount;
	var pa = 0;
	
	switch(optype)
	{
	// Reg/mem with reg to either
	case 0:
		d = (opcode & 0x02) >> 1;
		w = opcode & 0x01;
		mod = (extraBytes[0] & 0xC0) >> 6;
		reg = (extraBytes[0] & 0x38) >> 3;
		rm = extraBytes[0] & 0x07;
		
		if(d == 0)
		{
			src = PC.$8088._decodeReg(reg, w);
			
			if(mod == 3)
			{
				dst = PC.$8088._decodeReg(rm, w);
			}
			else
			{
				dst = 'mem';
			}
		}
		else
		{
			dst = PC.$8088._decodeReg(reg, w);
			
			if(mod == 3)
			{
				src = PC.$8088._decodeReg(rm, w);
			}
			else
			{
				src = 'mem';
			}
		}
		
		if(src == 'mem')
		{
			pa = PC.$8088._calculatePA(mod, rm);
			srcValue = PC.$8088._readmem(pa, w);
		}
		else
		{
			srcValue = PC.$8088.getRegisterGetterSetter(true)(src);
		}
		
		if(dst == 'mem')
		{
			pa = PC.$8088._calculatePA(mod, rm);
			dstValue = PC.$8088._readmem(pa, w);
		}
		else
		{
			dstValue = PC.$8088.getRegisterGetterSetter(true)(dst);
		}
		
		break;
	// reg/mem with imm. to same reg/mem
	case 1:
		var s = d;
		w = opcode & 0x01;
		mod = (extraBytes[0] & 0xC0) >> 6;
		rm = extraBytes[0] & 0x07;
		
		srcValue = PC.$8088._fetchNextInstructionByte();
		
		if(w == 1 && s == 0)
		{
			srcValue = (PC.$8088._fetchNextInstructionByte() << 8) | srcValue;
		}
		
		if(mod == 3)
		{
			dst = PC.$8088._decodeReg(rm, w);
			dstValue = PC.$8088.getRegisterGetterSetter(true)(dst);
		}
		else
		{
			dst = 'mem';
			pa = PC.$8088._calculatePA(mod, rm);
			dstValue = PC.$8088._readmem(pa, w);
		}
		
		break;
	// acu with imm. to same acu
	case 2:
		w = opcode & 0x01;
		srcValue = PC.$8088._fetchNextInstructionByte();
		
		if(w == 1)
		{
			srcValue = (PC.$8088._fetchNextInstructionByte() << 8) | srcValue;
		}
		
		dst = (w == 0) ? 'AL' : 'AX';
		dstValue = PC.$8088.getRegisterGetterSetter(true)(dst);
		
		break;
	// inc/dec reg.
	case 3:
		w = 1;
		reg = opcode & 0x07;
		dst = PC.$8088._decodeReg(reg, w);
		src = '';
		dstValue = PC.$8088.getRegisterGetterSetter(true)(dst);
		srcValue = 1;
		break;
	// SAL/SAR/SHR/RCL/RCR/ROL/ROR
	case 4:
		w = opcode & 0x01;
		mod = (extraBytes[0] & 0xC0) >> 6;
		rm = extraBytes[0] & 0x07;
		
		if(mod == 3)
		{
			dst = PC.$8088._decodeReg(rm, w);
			dstValue = PC.$8088.getRegisterGetterSetter(true)(dst);
		}
		else
		{
			dst = 'mem';
			pa = PC.$8088._calculatePA(mod, rm);
			dstValue = PC.$8088._readmem(pa, w);
		}
		
		src = dst;
		srcValue = dstValue;
		
		switch(opcode)
		{
		case 0xC0: case 0xC1:
			repeatCount = extraBytes[1];
			break;
		case 0xD0: case 0xD1:
			repeatCount = 1;
			break;
		case 0xD2: case 0xD3:
			repeatCount = PC.$8088.getCL();
			break;
		}
		break;
	default:
		throw "Invalid ALU operation type " + optype;
	}
	
	var result = 0;
	switch(opid)
	{
	// ADC
	case 0:
		result = srcValue + dstValue + PC.$8088.getC();
		break;
	// ADD
	case 1:
		result = srcValue + dstValue;
		break;
	// SBB
	case 2:
		result = srcValue - dstValue - PC.$8088.getC();
		break;
	// SUB
	case 3:
		result = srcValue - dstValue;
		break;
	// CMP
	case 4:
		result = srcValue - dstValue;
		break;
	// INC
	case 5:
		result = dstValue + 1;
		break;
	// DEC
	case 6:
		result = dstValue - 1;
		break;
	// AND
	case 7:
		result = srcValue & dstValue;
		break;
	// TEST
	case 8:
		result = srcValue & dstValue;
		break;
	// OR
	case 9:
		result = srcValue | dstValue;
		break;
	// XOR
	case 10:
		result = srcValue ^ dstValue;
		break;
	// SAL
	case 11:
		result = dstValue << repeatCount;
		
		if(w == 0)
		{
			PC.$8088.setO(PC.$8088.getC() == (srcValue & 0x80) >>> 7);
			PC.$8088.setC((srcValue & 0x80) >>> 7);
		}
		else
		{
			PC.$8088.setO(PC.$8088.getC() == (srcValue & 0x8000) >>> 23);
			PC.$8088.setC((srcValue & 0x8000) >>> 23);
		}
		
		break;
	// SAR
	case 12:
		result = dstValue >> repeatCount;
		
		PC.$8088.setC(srcValue & 0x0001);
		PC.$8088.setO(0);
		
		break;
	// SHR
	case 13:
		result = dstValue >>> repeatCount;
		PC.$8088.setC(srcValue & 0x0001);
		if(w == 0)
		{
			PC.$8088.setO((srcValue & 0x80) >>> 7);
		}
		else
		{
			PC.$8088.setO((srcValue & 0x8000) >>> 23);
		}
		break;
	// RCL
	case 14:
		result = dstValue;
		for(var i = 0; i < repeatCount; i++)
		{
			var c = PC.$8088.getC();
			
			if(w == 0)
			{
				PC.$8088.setC(dstValue & 0x80)
			}
			else
			{
				PC.$8088.setC(dstValue & 0x8000)
			}
			
			result = result << 1;
			result |= c;
		}
		break;
	// RCR
	case 15:
		for(var i = 0; i < repeatCount; i++)
		{
			var c = PC.$8088.getC();
			
			var msb;
			if(w == 0)
			{
				PC.$8088.setC(dstValue & 0x80)
				msb = (c == 0) ? 0 : 0x80;
			}
			else
			{
				PC.$8088.setC(dstValue & 0x8000)
				msb = (c == 0) ? 0 : 0x8000;
			}
			
			result = result >>> 1;
			result |= msb;
		}
		break;
	// ROL
	case 16:
		result = dstValue;
		for(var i = 0; i < repeatCount; i++)
		{
			result = result << 1;
		}
		
		PC.$8088.setC((result & 0x01) == 0 ? 0 : 1);
		break;
	// ROR
	case 17:
		result = dstValue;
		for(var i = 0; i < repeatCount; i++)
		{
			result = result >>> 1;
		}
		
		if(w == 0)
		{
			PC.$8088.setC((result & 0x80) == 0 ? 0 : 1);
		}
		else
		{
			PC.$8088.setC((result & 0x8000) == 0 ? 0 : 1);
		}
		break;
	// NEG
	case 18:
		result = ((~dstValue) & 0xFFFF) + 1;
		break;
	// NOT
	case 19:
		result = (~dstValue) & 0xFFFF;
		break;
	default:
		throw "Invalid ALU operation id " + opid;
	}
	
	if(opid != 4 && opid != 8)
	{
		if(dst == 'mem')
		{
			PC.$8088._writemem(pa, result, w);
		}
		else
		{
			PC.$8088.getRegisterGetterSetter(false)(dst, result, w == 0 ? 1 : 2);
		}
	}
	
	if(opid < 5)
	{
		var operand0 = srcValue;
		var operand1 = dstValue;
		
		if(opid > 1)
		{
			if(w == 0)
			{
				operand1 = operand1 ^ 0x80;
			}
			else
			{
				operand1 = operand1 ^ 0x8000;
			}
		}
		
		PC.$8088._calculateCarryFlag(w, result);
	}
	
	if(opid < 7)
	{
		PC.$8088._calculateAdjustFlag(operand0, operand1, result);
		PC.$8088._calculateOverflowFlag(w, operand0, operand1, result);
	}
	else if(opid < 11)
	{
		PC.$8088.setA(0);
		PC.$8088.setC(0);
		PC.$8088.setO(0);
	}
	else if(opid < 14)
	{
		if(opid == 11)
		{
			PC.$8088.setA((result & 0x10) == 0 ? 0 : 1);
		}
		else
		{
			PC.$8088.setA(0);
		}
		
		if(opid == 12)
		{
			PC.$8088.setO(0);
		}
		else if(opid == 11 || opid == 14 || opid == 16)
		{
			if(w == 0)
			{
				PC.$8088.setO(PC.$8088.getC() ^ ((result & 0x80) >> 7));
			}
			else
			{
				PC.$8088.setO(PC.$8088.getC() ^ ((result & 0x80) >> 15));
			}
		}
		else if(opid == 13 || opid == 15 || opid == 17)
		{
			if(w == 0)
			{
				PC.$8088.setO(((result & 0x40) >> 6) ^ ((result & 0x80) >> 7));
			}
			else
			{
				PC.$8088.setO(((result & 0x4000) >> 14) ^ ((result & 0x8000) >> 15));
			}
		}
	}
	
	if(opid < 14)
	{
		PC.$8088._calculateParityFlag(result);
		PC.$8088._calculateSignFlag(w, result);
		PC.$8088._calculateZeroFlag(w, result);
	}
};

PC.$8088.performJMPOperation = function(w, offset)
{
	var disp = offset;
	
	if(w == 0)
	{
		if((disp & 0x80) == 0)
		{
			PC.$8088.setIP(PC.$8088.getIP() + disp);
		}
		else
		{
			PC.$8088.setIP(PC.$8088.getIP() - (((~disp) & 0xFF) + 1));
		}
	}
	else
	{
		if((disp & 0x8000) == 0)
		{
			PC.$8088.setIP(PC.$8088.getIP() + disp);
		}
		else
		{
			PC.$8088.setIP(PC.$8088.getIP() - (((~disp) & 0xFFFF) + 1));
		}
	}
};

PC.$8088.performPUSHOperation = function(value)
{
	PC.$8088.setSP(PC.$8088.getSP() - 2);
	
	var pas = (PC.$8088.getSS() << 4) | PC.$8088.getSP();
	PC.$8088._writemem(pas, value, 2);
};

PC.$8088.performPOPOperation = function()
{
	var pas = (PC.$8088.getSS() << 4) | PC.$8088.getSP();
	var lo = PC.$8088._readmem(pas);
	var value = PC.$8088._readmem(pas + 1) << 8 | lo;
	
	PC.$8088.setSP(PC.$8088.getSP() + 2);
	
	return value;
};

PC.$8088.performCALLOperation = function(offset, seg)
{
	var disp = offset;
	
	if(seg == undefined)
	{
		PC.$8088.performPUSHOperation(PC.$8088.getIP());
		if(disp & 0x8000 == 0)
		{
			PC.$8088.setIP(PC.$8088.getIP() + disp);
		}
		else
		{
			PC.$8088.setIP(PC.$8088.getIP() - (((~disp) & 0xFFFF) + 1));
		}
	}
	else
	{
		PC.$8088.performPUSHOperation(PC.$8088.getCS());
		PC.$8088.performPUSHOperation(PC.$8088.getIP());
		PC.$8088.setIP(offset);
		PC.$8088.setCS(seg);
	}
};

function $_(tag)
{
	return document.createElement(tag);
}

function $(id)
{
	return document.getElementById(id);
}

function $c(table, row, col)
{
	return table.firstChild.childNodes[row].childNodes[col];
}

function createText(id, size)
{
	var text = $_('input');
	text.id = id;
	text.type = 'text';
	text.maxLength = size;
	text.size = size;
	return text;
}

function createButton(id, value, onclick)
{
	var button = $_('input');
	button.id = id;
	button.type = 'submit';
	button.value = value;
	button.onclick = onclick;
	return button;
}

function createTable(defMatrix)
{
	var rTable = $_('table');
	var table = $_('tbody');
	
	if(defMatrix)
	{
		for(var i = 0; i < defMatrix.length; i++)
		{
			var row = $_('tr');
			
			for(var j = 0; j < defMatrix[i].length; j++)
			{
				var col = $_('td');
				col.style.textAlign = 'center';
				if(defMatrix[i][j][0] > 1)
				{
					col.colSpan = defMatrix[i][j][0];	
				}
				
				if(defMatrix[i][j][1] > 1)
				{
					col.rowSpan = defMatrix[i][j][1];
				}
				
				if(defMatrix[i][j][2])
				{
					col.style.width = defMatrix[i][j][2] + '%';
				}
				
				row.appendChild(col);
			}
			
			table.appendChild(row);
		}
	}
	
	rTable.appendChild(table);
	
	rTable.cellPadding = '0';
	rTable.cellSpacing = '0';
	
	return rTable;
}

function getEventTarget(event)
{
	var obj = new Object();
	
	if(event)
	{
		obj.event = event;
		obj.target = event.target;
	}
	else
	{
		obj.event = window.event;
		obj.target = window.event.srcElement;
	}
	
	return obj;
}

var getRegister = function (registerName)
{
	if(registerName == 'AX')
	{
		return (parseInt(PC.regs['AH'], 16) << 8) | parseInt(PC.regs['AL'], 16);
	}
	
	if(registerName == 'BX')
	{
		return (parseInt(PC.regs['BH'], 16) << 8) | parseInt(PC.regs['BL'], 16);
	}

	if(registerName == 'CX')
	{
		return (parseInt(PC.regs['CH'], 16) << 8) | parseInt(PC.regs['CL'], 16);
	}

	if(registerName == 'DX')
	{
		return (parseInt(PC.regs['DH'], 16) << 8) | parseInt(PC.regs['DL'], 16);
	}
	
	return parseInt(PC.regs[registerName], 16);
};

var setRegister = function (registerName, value, bytes)
{
	var result = PC.$8088._formatHexView(value, bytes * 2);
	
	if(registerName == 'AX')
	{
		PC.regs['AL'] = result.substring(2, 4);
		PC.regs['AH'] = result.substring(0, 2);
	}
	else if(registerName == 'BX')
	{
		PC.regs['BL'] = result.substring(2, 4);
		PC.regs['BH'] = result.substring(0, 2);
	}
	else if(registerName == 'CX')
	{
		PC.regs['CL'] = result.substring(2, 4);
		PC.regs['CH'] = result.substring(0, 2);
	}
	else if(registerName == 'DX')
	{
		PC.regs['DL'] = result.substring(2, 4);
		PC.regs['DH'] = result.substring(0, 2);
	}
	else
	{
		PC.regs[registerName] = result;
	}
};

PC.$8088.getRegisterGetterSetter = function(getter)
{		
	if(getter)
	{
		return getRegister;	
	}
	
	return setRegister;
};

PC.$8088.getIP = function()
{
	return getRegister('IP');
};

PC.$8088.setIP = function(value)
{
	setRegister('IP', value, 2);
};

PC.$8088.getCS = function()
{
	return getRegister('CS');
};

PC.$8088.setCS = function(value)
{
	setRegister('CS', value, 2);
};

PC.$8088.getDI = function()
{
	return getRegister('DI');
};

PC.$8088.setDI = function(value)
{
	setRegister('DI', value, 2);
};

PC.$8088.getAH = function()
{
	return getRegister('AH');
};

PC.$8088.setAH = function(value)
{
	setRegister('AH', value, 1);
};

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

PC.$8088.getDS = function()
{
	return getRegister('DS');
};

PC.$8088.setDS = function(value)
{
	setRegister('DS', value, 2);
};

PC.$8088.getSI = function()
{
	return getRegister('SI');
};

PC.$8088.setSI = function(value)
{
	setRegister('SI', value, 2);
};

PC.$8088.getBH = function()
{
	return getRegister('BH');
};

PC.$8088.setBH = function(value)
{
	setRegister('BH', value, 1);
};

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

PC.$8088.getSS = function()
{
	return getRegister('SS');
};

PC.$8088.setSS = function(value)
{
	setRegister('SS', value, 2);
};

PC.$8088.getBP = function()
{
	return getRegister('BP');
};

PC.$8088.setBP = function(value)
{
	setRegister('BP', value, 2);
};

PC.$8088.getCH = function()
{
	return getRegister('CH');
};

PC.$8088.setCH = function(value)
{
	setRegister('CH', value, 1);
};

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

PC.$8088.getES = function()
{
	return getRegister('ES');
};

PC.$8088.setES = function(value)
{
	setRegister('ES', value, 2);
};

PC.$8088.getSP = function()
{
	return getRegister('SP');
};

PC.$8088.setSP = function(value)
{
	setRegister('SP', value, 2);
};

PC.$8088.getDH = function()
{
	return getRegister('DH');
};

PC.$8088.setDH = function(value)
{
	setRegister('DH', value, 1);
};

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

PC.$8088.getO = function()
{
	return getRegister('O');
};

PC.$8088.setO = function(value)
{
	setRegister('O', value, 0);
};

PC.$8088.getD = function()
{
	return getRegister('D');
};

PC.$8088.setD = function(value)
{
	setRegister('D', value, 0);
};

PC.$8088.getI = function()
{
	return getRegister('I');
};

PC.$8088.setI = function(value)
{
	setRegister('I', value, 0);
};

PC.$8088.getT = function()
{
	return getRegister('T');
};

PC.$8088.setT = function(value)
{
	setRegister('T', value, 0);
};

PC.$8088.getS = function()
{
	return getRegister('S');
};

PC.$8088.setS = function(value)
{
	setRegister('S', value, 0);
};

PC.$8088.getZ = function()
{
	return getRegister('Z');
};

PC.$8088.setZ = function(value)
{
	setRegister('Z', value, 0);
};

PC.$8088.getA = function()
{
	return getRegister('A');
};

PC.$8088.setA = function(value)
{
	setRegister('A', value, 0);
};

PC.$8088.getP = function()
{
	return getRegister('P');
};

PC.$8088.setP = function(value)
{
	setRegister('P', value, 0);
};

PC.$8088.getC = function()
{
	return getRegister('C');
};

PC.$8088.setC = function(value)
{
	setRegister('C', value, 0);
};
