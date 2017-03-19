/*Copyright (c) 2011-2012 Taner Mansur Redistribution or commercial use is prohibited without the author's permission.*/
PC.$8088.aaa = function(opcode, extraBytes)
{
	if((PC.$8088.getAL() & 0x0F) > 9 || PC.$8088.getA() == 1)
	{
		PC.$8088.setAL((PC.$8088.getAL() + 6) & 0x0F);
		PC.$8088.setAH(PC.$8088.getAH() + ((PC.$8088.getAL() < 0x06) ? 2 : 1));
		PC.$8088.setA(1);
		PC.$8088.setC(1);
	}
	else
	{
		PC.$8088.setA(0);
		PC.$8088.setC(0);
	}
	
	PC.$8088._calculateParityFlag(PC.$8088.getAL());
	PC.$8088._calculateSignFlag(0, PC.$8088.getAL());
	PC.$8088._calculateZeroFlag(0, PC.$8088.getAX());
};

PC.$8088.aad = function(opcode, extraBytes)
{
	var operand0 = PC.$8088.getAL();
	var operand1 = (PC.$8088.getAH() * 10) & 0x00FF;
	var result = operand0 + operand1;
	PC.$8088.setAL(result & 0x00FF);
	PC.$8088.setAH(0);
	
	PC.$8088._calculateAdjustFlag(operand0, operand1, result);
	PC.$8088._calculateCarryFlag(0, PC.$8088.getAL());
	PC.$8088._calculateOverflowFlag(0, operand0, operand1, result);
	PC.$8088._calculateParityFlag(PC.$8088.getAL());
	PC.$8088._calculateSignFlag(0, PC.$8088.getAL());
	PC.$8088._calculateZeroFlag(0, PC.$8088.getAL());
};

PC.$8088.aam = function(opcode, extraBytes)
{
	PC.$8088.setAH(PC.$8088.getAL() / 10);
	PC.$8088.setAL(PC.$8088.getAL() % 10);
	
	PC.$8088.setA(0);
	PC.$8088.setC(0);
	PC.$8088.setO(0);
	PC.$8088._calculateParityFlag(PC.$8088.getAL());
	PC.$8088._calculateSignFlag(0, PC.$8088.getAL());
	PC.$8088._calculateZeroFlag(0, PC.$8088.getAL());
};

PC.$8088.aas = function(opcode, extraBytes)
{
	if((PC.$8088.getAL() & 0x0F) > 9 || PC.$8088.getA() == 1)
	{
		PC.$8088.setAL((PC.$8088.getAL() - 6) & 0x0F);
		PC.$8088.setAH(PC.$8088.getAH() - 1);
		
		PC.$8088.setA(1);
		PC.$8088.setC(1);
	}
	else
	{
		PC.$8088.setA(0);
		PC.$8088.setC(0);
	}
	
	PC.$8088._calculateParityFlag(PC.$8088.getAL());
	PC.$8088._calculateSignFlag(0, PC.$8088.getAL());
	PC.$8088._calculateZeroFlag(0, PC.$8088.getAL());
};

PC.$8088.adc0 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(0, 0, opcode, extraBytes);
};

PC.$8088.adc1 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(0, 1, opcode, extraBytes);
};

PC.$8088.adc2 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(0, 2, opcode, extraBytes);
};

PC.$8088.add0 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(1, 0, opcode, extraBytes);
};

PC.$8088.add1 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(1, 1, opcode, extraBytes);
};

PC.$8088.add2 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(1, 2, opcode, extraBytes);
};

PC.$8088.and0 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(7, 0, opcode, extraBytes);
};

PC.$8088.and1 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(7, 1, opcode, extraBytes);
};

PC.$8088.and2 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(7, 2, opcode, extraBytes);
};

PC.$8088.call0 = function(opcode, extraBytes)
{
	var disp = (extraBytes[1] << 8) | extraBytes[0];
	
	PC.$8088.performCALLOperation(disp);
};

PC.$8088.call1 = function(opcode, extraBytes)
{
	var mod = (extraBytes[0] & 0xC0) >>> 6;
	var rm = extraBytes[0] & 0x07;
	
	var disp;
	if(mod == 3)
	{
		disp = PC.$8088.getRegisterGetterSetter(true)(PC.$8088._decodeReg(reg, 1));
	}
	else
	{
		var pa = PC.$8088._calculatePA(mod, rm);
		disp = PC.$8088._readmem(pa, 1);
	}
	
	PC.$8088.performCALLOperation(disp);
};

PC.$8088.call2 = function(opcode, extraBytes)
{
	var disp = (extraBytes[1] << 8) | extraBytes[0];
	var seg = (extraBytes[3] << 8) | extraBytes[2];
	
	PC.$8088.performCALLOperation(disp, seg);
};

PC.$8088.call3 = function(opcode, extraBytes)
{
	var mod = (extraBytes[0] & 0xC0) >>> 6;
	var rm = extraBytes[0] & 0x07;
	var seg = undefined;
	
	var disp;
	if(mod == 3)
	{
		disp = PC.$8088.getRegisterGetterSetter(true)(PC.$8088._decodeReg(reg, 1));
	}
	else
	{
		var pa = PC.$8088._calculatePA(mod, rm);
		disp = PC.$8088._readmem(pa, 1);
		seg = PC.$8088._readmem(pa + 2, 1);
	}
	
	PC.$8088.performCALLOperation(disp, seg);
};

PC.$8088.cbw = function(opcode, extraBytes){};

PC.$8088.clc = function(opcode, extraBytes)
{
	PC.$8088.setC(0);
};

PC.$8088.cld = function(opcode, extraBytes)
{
	PC.$8088.setD(0);
};

PC.$8088.cli = function(opcode, extraBytes)
{
	PC.$8088.setI(0);
};

PC.$8088.cmc = function(opcode, extraBytes)
{
	PC.$8088.setC(PC.$8088.getC() == 0 ? 1 : 0);
};

PC.$8088.cmp0 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(4, 0, opcode, extraBytes);
};
	
PC.$8088.cmp1 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(4, 1, opcode, extraBytes);
};

PC.$8088.cmp2 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(4, 2, opcode, extraBytes);
};

PC.$8088.cmps = function(opcode, extraBytes){};
PC.$8088.cwd = function(opcode, extraBytes){};

PC.$8088.daa = function(opcode, extraBytes)
{
	var al = PC.$8088.getAL();
	var cf = PC.$8088.getC();
	
	if((PC.$8088.getAL() & 0x0F) > 9 || PC.$8088.getA() == 1)
	{
		PC.$8088.setAL(PC.$8088.getAL() + 6);
		PC.$8088.setC(PC.$8088.getC() | cf);
		PC.$8088.setA(1);
	}

	if(PC.$8088.getAL() > 0x99 || PC.$8088.getC() == 1)
	{
		PC.$8088.setAL(PC.$8088.getAL() + 0x60);
		PC.$8088.setC(1);
	}
	
	PC.$8088._calculateParityFlag(PC.$8088.getAL());
	PC.$8088.setO((PC.$8088.getAL() & 0x80) > (al & 0x80));
	PC.$8088._calculateSignFlag(0, PC.$8088.getAL());
	PC.$8088._calculateZeroFlag(0, PC.$8088.getAX());
};

PC.$8088.das = function(opcode, extraBytes)
{
	var al = PC.$8088.getAL();
	if(PC.$8088.getC() == 1 || al > 0x9F || (al > 0x99 && PC.$8088.getA() == 0))
	{
		PC.$8088.setAL(PC.$8088.getAL() - 0x60);
		PC.$8088.setC(1);
	}

	if((PC.$8088.getAL() & 0x0F) > 9 || PC.$8088.getA() == 1)
	{
		PC.$8088.setAL(PC.$8088.getAL() - 0x06);
		PC.$8088.setA(1);
	}
	
	PC.$8088._calculateParityFlag(PC.$8088.getAL());
	PC.$8088.setO((PC.$8088.getAL() & 0x80) > (al & 0x80));
	PC.$8088._calculateSignFlag(0, PC.$8088.getAL());
	PC.$8088._calculateZeroFlag(0, PC.$8088.getAX());
};

PC.$8088.dec0 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(6, 0, opcode, extraBytes);
};

PC.$8088.dec1 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(6, 3, opcode, extraBytes);
};

PC.$8088.div = function(opcode, extraBytes)
{
	var w = opcode & 0x01;
	var mod = (extraBytes[0] & 0xC0) >>> 6;
	var rm = extraBytes[0] & 0x07;
	
	var pa = 0;
	var srcValue;
	if(mod == 3)
	{
		srcValue = PC.$8088.getRegisterGetterSetter(true)(PC.$8088._decodeReg(rm, w));
	}
	else
	{
		pa = PC.$8088._calculatePA(mod, rm);
		srcValue = PC.$8088._readmem(pa, w);
	}
	
	var dstValue = PC.$8088.getRegisterGetterSetter(true)('AX');
	if(w == 1)
	{
		dstValue = (PC.$8088.getRegisterGetterSetter(true)('DX') << 8) | dstValue;
	}
	
	var result = srcValue * dstValue;
	if(w == 0)
	{
		PC.$8088.getRegisterGetterSetter(false)('AL', result, 2);
		PC.$8088.getRegisterGetterSetter(false)('AH', result, 2);
	}
	else
	{
		PC.$8088.getRegisterGetterSetter(false)('DX', result & 0xFFFF0000, 2);
		PC.$8088.getRegisterGetterSetter(false)('AX', result & 0x0000FFFF, 2);
	}
	
	PC.$8088._calculateCarryFlag(w, result);
	PC.$8088._calculateOverflowFlag(w, srcValue, dstValue, result);
};

PC.$8088.hlt = function(opcode, extraBytes)
{
	console.info("CPU halted.");
	PC.$8088._stop();
};

PC.$8088.idiv = function(opcode, extraBytes)
{
	PC.$8088.div(opcode, extraBytes);
};

PC.$8088.imul = function(opcode, extraBytes)
{
	PC.$8088.mul(opcode, extraBytes);
};

PC.$8088.in0 = function(opcode, extraBytes)
{
	var w = opcode & 0x01;
	var regSetter = PC.$8088.getRegisterGetterSetter(false);
	var port = extraBytes[1];
	
	if(w == 0)
	{
		regSetter('AL', PC.$8088.getPortValue(port), 1);
	}
	else
	{
		var lo = PC.$8088.getPortValue(port);
		var value = (PC.$8088.getPortValue(port + 1) << 8) | lo;
		
		regSetter('AX', value, 2);	
	}
};

PC.$8088.in1 = function(opcode)
{
	var w = opcode & 0x01;
	var regSetter = PC.$8088.getRegisterGetterSetter(false);
	var port = PC.$8088.getRegisterGetterSetter(true)('DX');
	
	if(w == 0)
	{
		regSetter('AL', PC.$8088.getPortValue(port), 1);
	}
	else
	{
		var lo = PC.$8088.getPortValue(port);
		var value = (PC.$8088.getPortValue(port + 1) << 8) | lo;
		
		regSetter('AX', value, 2);	
	}
};

PC.$8088.inc0 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(5, 0, opcode, extraBytes);
};

PC.$8088.inc1 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(5, 3, opcode, extraBytes);
};

PC.$8088.int0 = function(opcode, extraBytes){};
PC.$8088.int1 = function(opcode, extraBytes){};
PC.$8088.into = function(opcode, extraBytes){};
PC.$8088.iret = function(opcode, extraBytes){};

PC.$8088.jb = function(opcode, extraBytes)
{
	if(PC.$8088.getC() == 1)
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.jbe = function(opcode, extraBytes)
{
	if(PC.$8088.getC() == 1 || PC.$8088.getZ() == 1)
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.jcxz = function(opcode, extraBytes)
{
	if(PC.$8088.getCX() == 0)
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.je = function(opcode, extraBytes)
{
	if(PC.$8088.getZ() == 1)
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.jl = function(opcode, extraBytes)
{
	if(PC.$8088.getS() != PC.$8088.getO())
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.jle = function(opcode, extraBytes)
{
	if(PC.$8088.getS() != PC.$8088.getO() || PC.$8088.getZ() == 1)
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.jmp0 = function(opcode, extraBytes)
{
	PC.$8088.performJMPOperation(1, (extraBytes[1] << 8) | extraBytes[0]);
};

PC.$8088.jmp1 = function(opcode, extraBytes)
{
	PC.$8088.performJMPOperation(0, extraBytes[0]);
};

PC.$8088.jmp2 = function(opcode, extraBytes)
{
	var mod = (extraBytes[0] & 0xC0) >>> 6;
	var rm = extraBytes[0] & 0x07;
	
	var disp;
	if(mod == 3)
	{
		disp = PC.$8088.getRegisterGetterSetter(true)(PC.$8088._decodeReg(rm, 1));
	}
	else
	{
		disp = PC.$8088._readmem(PC.$8088._calculatePA(mod, rm), 1);
	}
	
	PC.$8088.performJMPOperation(1, disp);
};

PC.$8088.jmp3 = function(opcode, extraBytes)
{
	PC.$8088.setIP((extraBytes[1] << 8) | extraBytes[0]);
	PC.$8088.setCS((extraBytes[3] << 8) | extraBytes[2]);
};

PC.$8088.jmp4 = function(opcode, extraBytes)
{
	var mod = (extraBytes[0] & 0xC0) >>> 6;
	var rm = extraBytes[0] & 0x07;
	
	var disp;
	var cs;
	if(mod == 3)
	{
		disp = PC.$8088.getRegisterGetterSetter(true)(PC.$8088._decodeReg(rm, 1));
		cs = 0;
	}
	else
	{
		disp = PC.$8088._readmem(PC.$8088._calculatePA(mod, rm), 1);
		cs = PC.$8088._readmem(PC.$8088._calculatePA(mod, rm) + 2, 1);
	}
	
	PC.$8088.setIP(disp);
	PC.$8088.setCS(cs);
};

PC.$8088.jnb = function(opcode, extraBytes)
{
	if(PC.$8088.getC() == 0)
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.jnbe = function(opcode, extraBytes)
{
	if(PC.$8088.getC() == 0 && PC.$8088.getZ() == 0)
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.jne = function(opcode, extraBytes)
{
	if(PC.$8088.getZ() == 0)
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.jnl = function(opcode, extraBytes)
{
	if(PC.$8088.getS() == PC.$8088.getO())
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.jnle = function(opcode, extraBytes)
{
	if(PC.$8088.getS() == PC.$8088.getO() && PC.$8088.getZ() == 0)
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.jno = function(opcode, extraBytes)
{
	if(PC.$8088.getO() == 0)
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.jnp = function(opcode, extraBytes)
{
	if(PC.$8088.getP() == 0)
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.jns = function(opcode, extraBytes)
{
	if(PC.$8088.getS() == 0)
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.jo = function(opcode, extraBytes)
{
	if(PC.$8088.getO() == 1)
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.jp = function(opcode, extraBytes)
{
	if(PC.$8088.getP() == 1)
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.js = function(opcode, extraBytes)
{
	if(PC.$8088.getS() == 1)
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.lahf = function(opcode, extraBytes)
{
	var value = (PC.$8088.getS() << 7) | (PC.$8088.getZ() << 6) | (PC.$8088.getA() << 4) | (PC.$8088.getP() << 2) | 0x02 | PC.$8088.getC();
	PC.$8088.getRegisterGetterSetter(false)('AH', value, 1);
};

PC.$8088.lds = function(opcode, extraBytes)
{
	var mod = (extraBytes[0] & 0xC0) >>> 6;
	var reg = (extraBytes[0] & 0x38) >>> 3;
	var rm = extraBytes[0] & 0x07;
	
	var pa = PC.$8088._calculatePA(mod, rm);
	var value0 = PC.$8088._readmem(pa, 1);
	var value1 = PC.$8088._readmem(pa + 2, 1);
	
	PC.$8088.getRegisterGetterSetter(false)(PC.$8088._decodeReg(reg, 1), value0, 2);
	PC.$8088.getRegisterGetterSetter(false)('DS', value1, 2);
};

PC.$8088.lea = function(opcode, extraBytes)
{
	var mod = (extraBytes[0] & 0xC0) >>> 6;
	var reg = (extraBytes[0] & 0x38) >>> 3;
	var rm = extraBytes[0] & 0x07;
	
	var ea = PC.$8088._calculateEA(mod, rm);
	PC.$8088.getRegisterGetterSetter(false)(PC.$8088._decodeReg(reg, 1), ea, 2);
};

PC.$8088.les = function(opcode, extraBytes)
{
	var mod = (extraBytes[0] & 0xC0) >>> 6;
	var reg = (extraBytes[0] & 0x38) >>> 3;
	var rm = extraBytes[0] & 0x07;
	
	var pa = PC.$8088._calculatePA(mod, rm);
	var value0 = PC.$8088._readmem(pa, 1);
	var value1 = PC.$8088._readmem(pa + 2, 1);
	
	PC.$8088.getRegisterGetterSetter(false)(PC.$8088._decodeReg(reg, 1), value0, 2);
	PC.$8088.getRegisterGetterSetter(false)('ES', value1, 2);
};

PC.$8088.lock = function(opcode, extraBytes)
{
	console.info("CPU lock is ignored.")
};

PC.$8088.loop = function(opcode, extraBytes)
{
	PC.$8088.setCX(PC.$8088.getCX() - 1);
	
	if(PC.$8088.getCX() != 0)
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.loopnz = function(opcode, extraBytes)
{
	PC.$8088.setCX(PC.$8088.getCX() - 1);
	
	if(PC.$8088.getCX() != 0 && PC.$8088.getZ() == 0)
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.loopz = function(opcode, extraBytes)
{
	PC.$8088.setCX(PC.$8088.getCX() - 1);
	
	if(PC.$8088.getCX() != 0 && PC.$8088.getZ() == 1)
	{
		PC.$8088.performJMPOperation(0, extraBytes[0]);
	}
};

PC.$8088.mov0 = function (opcode, extraBytes)
{
	var d = (opcode & 0x02) >>> 1;
	var w = opcode & 0x01;
	var mod = (extraBytes[0] & 0xC0) >>> 6;
	var reg = (extraBytes[0] & 0x38) >>> 3;
	var rm = extraBytes[0] & 0x07;
	
	var src = PC.$8088._decodeReg(reg, w);
	var dst = 'mem';
	var pa = 0;
	
	if(mod == 3)
	{
		dst = PC.$8088._decodeReg(rm, w);
	}
	
	if(dst == 'mem')
	{
		pa = PC.$8088._calculatePA(mod, rm);
	}
	
	if(d == 1)
	{
		var temp = src;
		src = dst;
		dst = temp;
	}
	
	var value;
	if(src == 'mem')
	{
		if(w == 0)
		{
			value = PC.$8088._readmem(pa);
		}
		else
		{
			value = (PC.$8088._readmem(pa + 1) << 8) | PC.$8088._readmem(pa);
		}
	}
	else
	{
		value = PC.$8088.getRegisterGetterSetter(true)(src);		
	}
	
	if(dst == 'mem')
	{
		PC.$8088._writemem(pa, value, w == 0 ? 1 : 2);
	}
	else
	{
		PC.$8088.getRegisterGetterSetter(false)(dst, value, w == 0 ? 1 : 2);
	}
};

PC.$8088.mov1 = function (opcode, extraBytes)
{
	var w = opcode & 0x01;
	var mod = (extraBytes[0] & 0xC0) >>> 6;
	var rm = extraBytes[0] & 0x07;
	
	if(mod == 3)
	{
		var regSetter = PC.$8088.getRegisterGetterSetter(false);
		var value;
		if(w == 0)
		{
			value = PC.$8088._fetchNextInstructionByte();
			regSetter(PC.$8088._decodeReg(rm, w), value, 1);
		}
		else
		{
			var lo = PC.$8088._fetchNextInstructionByte();
			value = (PC.$8088._fetchNextInstructionByte() << 8) | lo;
			regSetter(PC.$8088._decodeReg(rm, w), value, 2);
		}
	}
	else
	{
		var pa = PC.$8088._calculatePA(mod, rm);
		
		var value;
		if(w == 0)
		{
			value = PC.$8088._fetchNextInstructionByte();
			PC.$8088._writemem(pa, value, 1);
		}
		else
		{
			var lo = PC.$8088._fetchNextInstructionByte();
			value = (PC.$8088._fetchNextInstructionByte() << 8) | lo;
			PC.$8088._writemem(pa, value, 2);
		}
	}
};

PC.$8088.mov2 = function (opcode, extraBytes)
{
	var w = (opcode & 0x08) >>> 3;
	var reg = opcode & 0x07;
	
	var dataLow = extraBytes[0];
	var dataHi = 0;
	
	var value = dataLow;
	
	if(w == 1)
	{
		dataHi = PC.$8088._fetchNextInstructionByte();
		value = (dataHi << 8) | dataLow;
	}
	
	var regSetter = PC.$8088.getRegisterGetterSetter(false);
	regSetter(PC.$8088._decodeReg(reg, w), value, w == 0 ? 1 : 2);
};

PC.$8088.mov3 = function (opcode, extraBytes)
{
	var w = opcode & 0x01;
	
	var addrLo = extraBytes[0];
	var addrHi = extraBytes[1];
	
	var regSetter = PC.$8088.getRegisterGetterSetter(false);
	var seg = (PC.$8088._sop == undefined) ? PC.$8088.getDS() : PC.$8088.getRegisterGetterSetter(true)(PC.$8088._sop);
	var ea = (seg << 4) | (addrHi << 8) | addrLo;
	var value = PC.$8088._readmem(ea);
	
	if(w == 0)
	{
		regSetter('AL', value, 1);
	}
	else
	{
		value = (PC.$8088._readmem(ea + 1) << 8) | value;
		regSetter('AX', value, 2);
	}
};

PC.$8088.mov4 = function(opcode, extraBytes)
{
	var w = opcode & 0x01;
	
	var addrLo = extraBytes[0];
	var addrHi = extraBytes[1];
	
	var regGetter = PC.$8088.getRegisterGetterSetter(true);
	var seg = (PC.$8088._sop == undefined) ? PC.$8088.getDS() : PC.$8088.getRegisterGetterSetter(true)(PC.$8088._sop);
	var ea = (seg << 4) | (addrHi << 8) | addrLo;
	var value = regGetter(w == 0 ? 'AL' : 'AX');
	
	PC.$8088._writemem(ea, value, w == 0 ? 1 : 2);
};

PC.$8088.mov5 = function(opcode, extraBytes)
{
	var mod = (extraBytes[0] & 0xC0) >>> 6;
	var sr = (extraBytes[0] & 0x18) >>> 3;
	var rm = extraBytes[0] & 0x07;
	
	var regSetter = PC.$8088.getRegisterGetterSetter(false);
	
	var value;
	if(mod == 3)
	{
		var regGetter = PC.$8088.getRegisterGetterSetter(true);
		value = regGetter(PC.$8088._decodeReg(rm, 1));
	}
	else
	{
		var pa = PC.$8088._calculatePA(mod, rm);
		value = (PC.$8088._readmem(pa + 1) << 8) | PC.$8088._readmem(pa);
	}
	
	regSetter(PC.$8088._decodeSr(sr), value, 2);
};

PC.$8088.mov6 = function(opcode, extraBytes)
{
	var mod = (extraBytes[0] & 0xC0) >>> 6;
	var sr = (extraBytes[0] & 0x18) >>> 3;
	var rm = extraBytes[0] & 0x07;
	
	var regGetter = PC.$8088.getRegisterGetterSetter(true);
	value = regGetter(PC.$8088._decodeSr(sr));
	
	if(mod == 3)
	{
		PC.$8088.getRegisterGetterSetter(false)(PC.$8088._decodeReg(rm, 1), value, 2);
	}
	else
	{
		PC.$8088._writemem(PC.$8088._calculatePA(mod, rm), value, 2);
	}
};

PC.$8088.movs = function(opcode, extraBytes){};

PC.$8088.mul = function(opcode, extraBytes)
{
	var w = opcode & 0x01;
	var mod = (extraBytes[0] & 0xC0) >>> 6;
	var rm = extraBytes[0] & 0x07;
	
	var pa = 0;
	var srcValue;
	if(mod == 3)
	{
		srcValue = PC.$8088.getRegisterGetterSetter(true)(PC.$8088._decodeReg(rm, w));
	}
	else
	{
		pa = PC.$8088._calculatePA(mod, rm);
		srcValue = PC.$8088._readmem(pa, w);
	}
	
	var dstValue = PC.$8088.getRegisterGetterSetter(true)(w == 0 ? 'AL' : 'AX');
	var result = srcValue * dstValue;
	
	if(w == 0)
	{
		PC.$8088.getRegisterGetterSetter(false)('AX', result, 2);
	}
	else
	{
		PC.$8088.getRegisterGetterSetter(false)('DX', result & 0xFFFF0000, 2);
		PC.$8088.getRegisterGetterSetter(false)('AX', result & 0x0000FFFF, 2);
	}
	
	PC.$8088._calculateAdjustFlag(srcValue, dstValue, result);
	PC.$8088._calculateCarryFlag(w, result);
	PC.$8088._calculateParityFlag(result);
	PC.$8088._calculateOverflowFlag(w, srcValue, dstValue, result);
	PC.$8088._calculateSignFlag(w, result);
	PC.$8088._calculateZeroFlag(w, result);
};

PC.$8088.neg = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(7, 0, opcode, extraBytes);
};

PC.$8088.not = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(12, 0, opcode, extraBytes);
};

PC.$8088.or0 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(9, 0, opcode, extraBytes);
};

PC.$8088.or1 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(9, 1, opcode, extraBytes);
};

PC.$8088.or2 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(9, 2, opcode, extraBytes);
};

PC.$8088.out0 = function(opcode, extraBytes)
{
	var w = opcode & 0x01;
	var regGetter = PC.$8088.getRegisterGetterSetter(true);
	var port = extraBytes[1];
	
	if(w == 0)
	{
		PC.$8088.setPortValue(port, regGetter('AL'), 1);
	}
	else
	{
		PC.$8088.setPortValue(port, regGetter('AX'), 2);	
	}
};

PC.$8088.out1 = function(opcode)
{
	var w = opcode & 0x01;
	var regGetter = PC.$8088.getRegisterGetterSetter(true);
	var port = PC.$8088.getRegisterGetterSetter(true)('DX');
	
	if(w == 0)
	{
		PC.$8088.setPortValue(port, regGetter('AL'), 1);
	}
	else
	{
		PC.$8088.setPortValue(port, regGetter('AX'), 2);	
	}
};

PC.$8088.pop0 = function(opcode, extraBytes)
{
	var mod = (extraBytes[0] & 0xC0) >>> 6;
	var rm = extraBytes[0] & 0x07;
	
	if(mod == 3)
	{
		var value = PC.$8088.performPOPOperation();
		
		PC.$8088.getRegisterGetterSetter(false)(PC.$8088._decodeReg(rm, 1), value, 2);
	}
	else
	{
		var pa = PC.$8088._calculatePA(mod, rm);
		var value = PC.$8088.performPOPOperation();
		
		PC.$8088._writemem(pa, value, 2);
	}
};

PC.$8088.pop1 = function(opcode, extraBytes)
{
	var reg = extraBytes[0] & 0x07;
	var value = PC.$8088.performPOPOperation();
	
	PC.$8088.getRegisterGetterSetter(false)(PC.$8088._decodeReg(reg, 1), value, 2);
};

PC.$8088.pop2 = function(opcode, extraBytes)
{
	var sr = (extraBytes[0] & 0x18) >>> 3;
	var value = PC.$8088.performPOPOperation();
	
	PC.$8088.getRegisterGetterSetter(false)(PC.$8088._decodeSr(sr), value, 2);
};

PC.$8088.popf = function(opcode, extraBytes)
{
	var value = PC.$8088.performPOPOperation();
	
	PC.$8088.setS((value & 0x8000) >>> 15);
	PC.$8088.setZ((value & 0x4000) >>> 14);
	PC.$8088.setA((value & 0x1000) >>> 12);
	PC.$8088.setP((value & 0x0400) >>> 10);
	PC.$8088.setC((value & 0x0100) >>> 8);
	PC.$8088.setO((value & 0x0008) >>> 3);
	PC.$8088.setD((value & 0x0004) >>> 2);
	PC.$8088.setI((value & 0x0002) >>> 1);
};

PC.$8088.push0 = function(opcode, extraBytes)
{
	var mod = (extraBytes[0] & 0xC0) >>> 6;
	var rm = extraBytes[0] & 0x07;
	
	if(mod == 3)
	{
		PC.$8088.performPUSHOperation(PC.$8088.getRegisterGetterSetter(true)(PC.$8088._decodeReg(rm, 1)));
	}
	else
	{
		var pa = PC.$8088._calculatePA(mod, rm);
		var lo = PC.$8088._readmem(pa);
		var value = (PC.$8088._readmem(pa + 1) << 8) | lo;
		
		PC.$8088.performPUSHOperation(value);
	}
};

PC.$8088.push1 = function(opcode, extraBytes)
{
	var reg = extraBytes[0] & 0x07;
	
	PC.$8088.performPUSHOperation(PC.$8088.getRegisterGetterSetter(true)(PC.$8088._decodeReg(reg, 1)));
};

PC.$8088.push2 = function(opcode, extraBytes)
{
	var sr = (extraBytes[0] & 0x18) >>> 3;
	
	PC.$8088.performPUSHOperation(PC.$8088.getRegisterGetterSetter(true)(PC.$8088._decodeSr(sr)));
};

PC.$8088.pushf = function(opcode, extraBytes)
{
	PC.$8088.setSP(PC.$8088.getSP() - 2);
	
	var pas = (PC.$8088.getSS() << 4) | PC.$8088.getSP();
	var lo = (PC.$8088.getO() << 3) | (PC.$8088.getD() << 2) | (PC.$8088.getI() << 1);
	var hi = (PC.$8088.getS() << 7) | (PC.$8088.getZ() << 6) | (PC.$8088.getA() << 4) | (PC.$8088.getP() << 2) | 0x02 | PC.$8088.getC();
	var value = (hi << 8) | lo;
	
	PC.$8088.performPUSHOperation(value);
};

PC.$8088.rcl = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(14, 4, opcode, extraBytes);
};

PC.$8088.rcr = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(15, 4, opcode, extraBytes);
};

PC.$8088.rep0 = function(opcode, extraBytes){};
PC.$8088.rep1 = function(opcode, extraBytes){};

PC.$8088.ret0 = function(opcode, extraBytes)
{
	PC.$8088.setIP(PC.$8088.performPOPOperation());
};

PC.$8088.ret1 = function(opcode, extraBytes)
{
	var value = (extraBytes[1] << 8) | extraBytes[0];
	PC.$8088.setIP(PC.$8088.performPOPOperation());
	
	if(value & 0x8000 == 0)
	{
		PC.$8088.setSP(PC.$8088.getSP() + value);
	}
	else
	{
		PC.$8088.setSP(PC.$8088.getSP() - (((~value) & 0xFFFF) + 1));
	}
};

PC.$8088.ret2 = function(opcode, extraBytes)
{
	PC.$8088.setIP(PC.$8088.performPOPOperation());
	PC.$8088.setCS(PC.$8088.performPOPOperation());
};

PC.$8088.ret3 = function(opcode, extraBytes)
{
	var value = (extraBytes[1] << 8) | extraBytes[0];
	PC.$8088.setIP(PC.$8088.performPOPOperation());
	PC.$8088.setCS(PC.$8088.performPOPOperation());
	
	if(value & 0x8000 == 0)
	{
		PC.$8088.setSP(PC.$8088.getSP() + value);
	}
	else
	{
		PC.$8088.setSP(PC.$8088.getSP() - (((~value) & 0xFFFF) + 1));
	}
};

PC.$8088.rol = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(16, 4, opcode, extraBytes);
};

PC.$8088.ror = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(17, 4, opcode, extraBytes);
};

PC.$8088.sahf = function(opcode, extraBytes)
{
	var value = PC.$8088.getRegisterGetterSetter(true)('AH');
	
	PC.$8088.setS((value & 0x80) >>> 7);
	PC.$8088.setZ((value & 0x40) >>> 6);
	PC.$8088.setA((value & 0x10) >>> 4);
	PC.$8088.setP((value & 0x04) >>> 2);
	PC.$8088.setC(value & 0x01);
};

PC.$8088.sal = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(11, 4, opcode, extraBytes);
};

PC.$8088.sar = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(12, 4, opcode, extraBytes);
};

PC.$8088.sbb0 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(2, 0, opcode, extraBytes);
};

PC.$8088.sbb1 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(2, 1, opcode, extraBytes);
};

PC.$8088.sbb2 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(2, 2, opcode, extraBytes);
};

PC.$8088.scas = function(opcode, extraBytes){};

PC.$8088.segCS = function(opcode, extraBytes)
{
	PC.$8088._sop = 'CS';
};

PC.$8088.segDS = function(opcode, extraBytes)
{
	PC.$8088._sop = 'DS';
};

PC.$8088.segES = function(opcode, extraBytes)
{
	PC.$8088._sop = 'ES';
};

PC.$8088.segSS = function(opcode, extraBytes)
{
	PC.$8088._sop = 'SS';
};

PC.$8088.shr = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(13, 4, opcode, extraBytes);
};

PC.$8088.stc = function(opcode, extraBytes)
{
	PC.$8088.setC(1);
};

PC.$8088.std = function(opcode, extraBytes)
{
	PC.$8088.setD(1);
};

PC.$8088.stds = function(opcode, extraBytes){};

PC.$8088.sti = function(opcode, extraBytes)
{
	PC.$8088.setI(1);
};

PC.$8088.sub0 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(3, 0, opcode, extraBytes);
};

PC.$8088.sub1 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(3, 1, opcode, extraBytes);
};

PC.$8088.sub2 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(3, 2, opcode, extraBytes);
};

PC.$8088.test0 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(8, 0, opcode, extraBytes);
};

PC.$8088.test1 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(8, 1, opcode, extraBytes);
};

PC.$8088.test2 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(8, 2, opcode, extraBytes);
};

PC.$8088.wait = function(opcode, extraBytes)
{
	console.info("CPU is waiting.");
	PC.$8088._stop();
};

PC.$8088.xchg0 = function(opcode, extraBytes)
{
	var w = opcode & 0x01;
	var mod = (extraBytes[0] & 0xC0) >>> 6;
	var reg = (extraBytes[0] & 0x38) >>> 3;
	var rm = extraBytes[0] & 0x07;
	
	if(mod == 3)
	{
		var src = PC.$8088._decodeReg(reg, w);
		var dst = PC.$8088._decodeReg(rm, w);
		var regGetter = PC.$8088.getRegisterGetterSetter(true);
		var regSetter = PC.$8088.getRegisterGetterSetter(false);
		var temp = regGetter(dst);
		
		regSetter(dst, regGetter(src), w == 0 ? 1 : 2);
		regSetter(src, temp, w == 0 ? 1 : 2);
	}
	else
	{
		var dst = PC.$8088._decodeReg(reg, w);
		var pa = PC.$8088._calculatePA(mod, rm);
		var lo = PC.$8088._readmem(pa);
		var value = PC.$8088._readmem(pa + 1) << 8 | lo;
		var temp = PC.$8088.getRegisterGetterSetter(true)(dst);
		
		PC.$8088.getRegisterGetterSetter(false)(dst, value, w == 0 ? 1 : 2);
		PC.$8088._writemem(pa, temp, w == 0 ? 1 : 2);
	}
};

PC.$8088.xchg1 = function(opcode)
{
	var reg = extraBytes[0] & 0x07;
	var src = PC.$8088._decodeReg(reg, 1);
	var dst = PC.$8088._decodeReg(rm, 1);
	var regGetter = PC.$8088.getRegisterGetterSetter(true);
	var regSetter = PC.$8088.getRegisterGetterSetter(false);
	var temp = regGetter(dst);
	
	regSetter(dst, regGetter(src), 2);
	regSetter(src, temp, 2);
};

PC.$8088.xlat = function(opcode, extraBytes)
{
	var regGetter = PC.$8088.getRegisterGetterSetter(true);
	var regSetter = PC.$8088.getRegisterGetterSetter(false);
	var pa = (regGetter('DS') << 4) + regGetter('BX') + regGetter('AL');
	
	regSetter('AL', PC.$8088._readmem(pa), 1);
};

PC.$8088.xor0 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(10, 0, opcode, extraBytes);
};

PC.$8088.xor1 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(10, 1, opcode, extraBytes);
};

PC.$8088.xor2 = function(opcode, extraBytes)
{
	PC.$8088.performALUOperation(10, 2, opcode, extraBytes);
};
