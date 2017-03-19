/*Copyright (c) 2011-2012 Taner Mansur Redistribution or commercial use is prohibited without the author's permission.*/
PC.tryToGet = function(byteArr, index)
{
	if(index < byteArr.length)
	{
		return byteArr[index];
	}
	
	return null;
};

PC.tryToGetMOD_RM_R = function(byteArr, index, w, s, n)
{
	var location = index;
	var values = [];

	if((values[0] = PC.tryToGet(byteArr, location)) == null)
	{
		return [0, null];
	}
	
	var mod = (values[0] & 0xC0) >>> 6;
	var r = (values[0] & 0x38) >>> 3;
	var rm = values[0] & 0x07;
	
	if(n != undefined && n != r)
	{
		return [1, null];
	}
	
	var disp;
	switch(mod)
	{
	case 0:
		disp = null;
		break;
	case 1:
		if((values[1] = PC.tryToGet(byteArr, ++location)) == null)
		{
			return [1, null];
		}
		
		disp = PC.$8088._formatHexView(values[1], 2);
		break;
	case 2:
		if((values[1] = PC.tryToGet(byteArr, ++location)) == null)
		{
			return [1, null];
		}

		if((values[2] = PC.tryToGet(byteArr, ++location)) == null)
		{
			return [2, null];
		}
		
		disp = PC.$8088._formatHexView((values[2] << 8) | values[1], 4);
		break;
	case 3:
		disp = null;
		break;
	}
	
	var reg;
	if(s == undefined)
	{
		reg = PC.$8088._decodeReg(r, w);
	}
	else
	{
		reg = PC.$8088._decodeSr(s);
	}
	
	var dst;
	if(mod == 3)
	{
		dst = PC.$8088._decodeReg(rm, w);
	}
	else
	{
		switch(rm)
		{
		case 0:
			dst = "BX + SI";
			break;
		case 1:
			dst = "BX + DI";
			break;
		case 2:
			dst = "BP + SI";
			break;
		case 3:
			dst = "BP + DI";
			break;
		case 4:
			dst = "SI";
			break;
		case 5:
			dst = "DI";
			break;
		case 6:
			if(mod == 0)
			{
				if((values[1] = PC.tryToGet(byteArr, ++location)) == null)
				{
					return [1, null];
				}

				if((values[2] = PC.tryToGet(byteArr, ++location)) == null)
				{
					return [2, null];
				}
				
				dst = PC.$8088._formatHexView((values[2] << 8) | values[1], 4);
			}
			else
			{
				dst = "BP";
			}
			break;
		case 7:
			dst = "BX";
			break;
		}
	}
	
	if(s != undefined)
	{
		return [location - index, mod, reg, dst, disp];
	}
	
	if(n == undefined)
	{	
		return [location - index, mod, reg, dst, disp];
	}
	
	return [location - index, mod, dst, dst, disp];
};

PC.tryToGetImmediateValue = function(byteArr, index, byteCount)
{
	var location = index;
	var values = [];

	var value = 0;
	for(var i = 0; i < byteCount; i++)
	{
		if((values[i] = PC.tryToGet(byteArr, ++location)) == null)
		{
			return [i, PC.appendDB(byteArr, index, i + 1)];
		}
		
		value = (values[i] << (i * 8)) | value;
	}
	
	return [byteCount, value];
};

PC.appendDB = function(byteArr, index, byteCount)
{
	var result = "";
	var count = 0;
	
	while(count != byteCount)
	{
		var value = PC.$8088._formatHexView(byteArr[index + count], 2);
		result += PC.$8088._formatHexView(PC.$8088.getPC() + index + count, 5) + " " + value + "\tDB\t" + value + "\n";
		count++;
	}
	
	return result.length > 0 ? result.substring(0, result.length - 1) : result;
};

PC.appendInstructionNoOperands = function(byteArr, index, instruction, checkBytes)
{
	var location = index;
	var byteCount = 1;
	if(checkBytes)
	{
		for(var i = 0; i < checkBytes.length; i++)
		{
			if(checkBytes[i] != PC.tryToGet(byteArr, ++location))
			{
				return [location - index, PC.appendDB(byteArr, location - 1, location - index + 1)];
			}
		}
		
		byteCount += checkBytes.length;
	}
	
	return [location - index, PC.$8088._formatHexView(PC.$8088.getPC() + index, 5) + " " + PC.concatBytes(byteArr, index, byteCount) +"\t" + instruction];
};

PC.appendInstructionOneOperand = function(byteArr, index, instruction, operandSize, operandOffset)
{
	var location = index;
	var operand = 0;
	for(var i = 0; i < operandSize; i++)
	{
		var temp;
		if((temp = PC.tryToGet(byteArr, ++location)) == null)
		{
			return [location - index, PC.appendDB(byteArr, location - 1, location - index + 1)];
		}
		
		operand = (temp << (8 * i)) | operand;
	}

	if(operandOffset)
	{
		operand += (index & 0x0F) + operandSize + 1;
	}
	
	return [location - index, PC.$8088._formatHexView(PC.$8088.getPC() + index, 5) + " " + PC.concatBytes(byteArr, index, operandSize + 1) +"\t" + instruction + "\t" + PC.$8088._formatHexView(operand, operandSize * 2)];
};

PC.concatBytes = function(byteArr, start, count)
{
	var result = "";
	
	for(var i = 0; i < count; i++)
	{
		result += PC.$8088._formatHexView(byteArr[start + i], 2);
	}
	
	return result;
};

PC.appendInstructionWithMODRMR = function(byteArr, index, instruction, direction, word, segment, operandCount, n, isImmediate)
{
	var location = index;
	var modRMR = PC.tryToGetMOD_RM_R(byteArr, ++location, word, segment, n);
	if(modRMR[1] == null)
	{
		return [modRMR[0], PC.appendDB(byteArr, index, modRMR[0] + 1)];
	}
	
	var src;
	var dst;
	if(modRMR[1] == 3)
	{
		src = modRMR[3];
		dst = modRMR[2];
	}
	else if(modRMR[1] == 0)
	{
		src = "[ " + modRMR[3] + " ]";
		dst = modRMR[2];
	}
	else
	{
		src = "[ " + modRMR[3] + " + " + modRMR[4] + " ]";
		dst = modRMR[2];
	}
	
	if(direction == 1)
	{
		var temp = dst;
		dst = src;
		src = temp;
	}
	
	if(operandCount == 2)
	{
		if(n == undefined || segment != undefined)
		{
			return [modRMR[0] + 1, PC.$8088._formatHexView(PC.$8088.getPC() + index, 5) + " " + PC.concatBytes(byteArr, index, modRMR[0] + 2) + "\t" + instruction + "\t" + src + ", " + dst];
		}
		
		var immValue = PC.tryToGetImmediateValue(byteArr, index + modRMR[0] + 1, word);
		if(immValue[1] == null)
		{
			return [modRMR[0] + immValue[0], PC.appendDB(byteArr, index, modRMR[0] + immValue[0])];
		}
		
		return [modRMR[0] + immValue[0], PC.$8088._formatHexView(PC.$8088.getPC() + index, 5) + " " + PC.concatBytes(byteArr, index, modRMR[0] + 2) + "\t" + instruction + "\t" + src + ", " + PC.$8088._formatHexView(immValue[1], word == 1 ? 4 : 2)];
	}
	
	if(operandCount == 3)
	{
		var immValue = PC.tryToGetImmediateValue(byteArr, index + modRMR[0] + 1, word);
		if(immValue[1] == null)
		{
			return [modRMR[0] + immValue[0], PC.appendDB(byteArr, index, modRMR[0] + immValue[0])];
		}
		
		return [modRMR[0] + 1, PC.$8088._formatHexView(PC.$8088.getPC() + index, 5) + " " + PC.concatBytes(byteArr, index, modRMR[0] + 2) + "\t" + instruction + "\t" + src + ", " + dst + ", " + immValue[0]];
	}
	
	return [modRMR[0] + 1, PC.$8088._formatHexView(PC.$8088.getPC() + index, 5) + " " + PC.concatBytes(byteArr, index, modRMR[0] + 2) + "\t" + instruction + "\t" + src];
};

PC.appendInstructionWithImmediateValue = function(byteArr, index, instruction, byteCount, operandOffset, format)
{
	var location = index;
	var immValue = PC.tryToGetImmediateValue(byteArr, index, byteCount);
	
	if(immValue[1] == null)
	{
		return immValue;
	}
	
	if(operandOffset)
	{
		immValue[1] += (index & 0x0F) + byteCount + 1;
	}
	
	switch(format)
	{
	case 0:
		return [byteCount, PC.$8088._formatHexView(PC.$8088.getPC() + index, 5) + " " + PC.concatBytes(byteArr, index, byteCount + 1) + "\t" + instruction + "\t" + PC.$8088._formatHexView(immValue[1] & 0x0000FFFF, byteCount) + ", " + PC.$8088._formatHexView((immValue[1] & 0xFFFF0000) >> 16, byteCount)];
	case 1:
		return [byteCount, PC.$8088._formatHexView(PC.$8088.getPC() + index, 5) + " " + PC.concatBytes(byteArr, index, byteCount + 1) + "\t" + instruction + " " + PC.$8088._formatHexView(immValue[1], byteCount * 2)];
	case 2:
		return [byteCount, PC.$8088._formatHexView(PC.$8088.getPC() + index, 5) + " " + PC.concatBytes(byteArr, index, byteCount + 1) + "\t" + instruction + "\t" + PC.$8088._formatHexView(((PC.$8088.getPC() + index) & 0x0FFFF) + ((immValue[1] & 0x80) > 0 ? immValue[1] - 0x100 : immValue[1]) + 2, 4)];
	case 3:
		return [byteCount, PC.$8088._formatHexView(PC.$8088.getPC() + index, 5) + " " + PC.concatBytes(byteArr, index, byteCount + 1) + "\t" + instruction + "\t" + PC.$8088._formatHexView(((PC.$8088.getPC() + index) & 0x0FFFF) + ((immValue[1] & 0x8000) > 0 ? immValue[1] - 0x10000 : immValue[1]) + 3, 4)];
	}
	
	return [byteCount, PC.$8088._formatHexView(PC.$8088.getPC() + index, 5) + " " + PC.concatBytes(byteArr, index, byteCount + 1) + "\t" + instruction + "\t" + PC.$8088._formatHexView(immValue[1], byteCount * 2)];
};

PC._disasm = function(pByteArr, start, end)
{
	var byteArr = pByteArr;
	if(start != undefined && end != undefined)
	{
		if(byteArr.subarray)
		{
			byteArr = byteArr.subarray(start, end);
		}
		else
		{
			byteArr = byteArr.slice(start, end);
		}
	}
	
	var result = "";
	var index = 0;
	var values = [];
	while((values[0] = PC.tryToGet(byteArr, index)) != null)
	{
		var arr;
		var instruction;
		var modRMR;
		var direction;
		var word;
		var segment;
		var n;
		switch(values[0])
		{
		case 0x00: case 0x01: case 0x02: case 0x03: case 0x08: case 0x09: case 0x0A: case 0x0B: case 0x10: case 0x11: case 0x12: case 0x13: case 0x18: case 0x19: case 0x1A: case 0x1B: case 0x20: case 0x21: case 0x22: case 0x23: case 0x28: case 0x29: case 0x2A: case 0x2B: case 0x30: case 0x31: case 0x32: case 0x33: case 0x38: case 0x39: case 0x3A: case 0x3B:
			direction = (values[0] & 0x02) >>> 1;
			word = values[0] & 0x01;
			
			switch(values[0])
			{
			case 0x00: case 0x01: case 0x02: case 0x03:
				instruction = "ADD";
				break;
			case 0x08: case 0x09: case 0x0A: case 0x0B:
				instruction = "OR";
				break;
			case 0x10: case 0x11: case 0x12: case 0x13:
				instruction = "ADC";
				break;
			case 0x18: case 0x19: case 0x1A: case 0x1B:
				instruction = "SBB";
				break;
			case 0x20: case 0x21: case 0x22: case 0x23:
				instruction = "AND";
				break;
			case 0x28: case 0x29: case 0x2A: case 0x2B:
				instruction = "SUB";
				break;
			case 0x30: case 0x31: case 0x32: case 0x33:
				instruction = "XOR";
				break;
			case 0x38: case 0x39: case 0x3A: case 0x3B:
				instruction = "CMP";
				break;
			}
			
			arr = PC.appendInstructionWithMODRMR(byteArr, index, instruction, direction, word, undefined, 2);
			break;
		case 0x04:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "ADD\tAL,", 1);
			break;
		case 0x05:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "ADD\tAX,", 2);
			break;
		case 0x06:
			arr = PC.appendInstructionNoOperands(byteArr, index, "PUSH ES");
			break;
		case 0x07:
			arr = PC.appendInstructionNoOperands(byteArr, index, "POP ES");
			break;
		case 0x08:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x09:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x0A:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x0B:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x0C:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "OR\tAX,", 1);
			break;
		case 0x0D:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "OR\tAX,", 2);
			break;
		case 0x0E:
			arr = PC.appendInstructionNoOperands(byteArr, index, "PUSH CS");
			break;
		case 0x0F:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x14:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "ADC", 1);
			break;
		case 0x15:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "ADC", 2);
			break;
		case 0x16:
			arr = PC.appendInstructionNoOperands(byteArr, index, "PUSH SS");
			break;
		case 0x17:
			arr = PC.appendInstructionNoOperands(byteArr, index, "POP SS");
			break;
		case 0x18:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "SBB", 0, 0);
			break;
		case 0x19:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "SBB", 0, 1);
			break;
		case 0x1A:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "SBB", 1, 0);
			break;
		case 0x1B:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "SBB", 1, 1);
			break;
		case 0x1C:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "SBB", 1);
			break;
		case 0x1D:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "SBB", 2);
			break;
		case 0x1E:
			arr = PC.appendInstructionNoOperands(byteArr, index, "PUSH DS");
			break;
		case 0x1F:
			arr = PC.appendInstructionNoOperands(byteArr, index, "POP DS");
			break;
		case 0x24:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "AND", 1);
			break;
		case 0x25:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "AND", 2);
			break;
		case 0x26:
			arr = PC.appendInstructionNoOperands(byteArr, index, "ES:");
			break;
		case 0x27:
			arr = PC.appendInstructionNoOperands(byteArr, index, "DAA");
			break;
		case 0x28:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "SUB", 0, 0);
			break;
		case 0x29:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "SUB", 0, 1);
			break;
		case 0x2A:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "SUB", 1, 0);
			break;
		case 0x2B:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "SUB", 1, 1);
			break;
		case 0x2C:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "SUB", 1);
			break;
		case 0x2D:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "SUB\tAX,", 2);
			break;
		case 0x2E:
			arr = PC.appendInstructionNoOperands(byteArr, index, "CS:");
			break;
		case 0x2F:
			arr = PC.appendInstructionNoOperands(byteArr, index, "DAS");
			break;
		case 0x34:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "XOR", 1);
			break;
		case 0x35:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "XOR\tAX,", 2);
			break;
		case 0x36:
			arr = PC.appendInstructionNoOperands(byteArr, index, "SS:");
			break;
		case 0x37:
			arr = PC.appendInstructionNoOperands(byteArr, index, "AAA");
			break;
		case 0x38:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x39:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x3A:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x3B:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x3C:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "CMP", 1);
			break;
		case 0x3D:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "CMP", 2);
			break;
		case 0x3E:
			arr = PC.appendInstructionNoOperands(byteArr, index, "DS:");
			break;
		case 0x3F:
			arr = PC.appendInstructionNoOperands(byteArr, index, "AAS");
			break;
		case 0x40:
			arr = PC.appendInstructionNoOperands(byteArr, index, "INC AX");
			break;
		case 0x41:
			arr = PC.appendInstructionNoOperands(byteArr, index, "INC CX");
			break;
		case 0x42:
			arr = PC.appendInstructionNoOperands(byteArr, index, "INC DX");
			break;
		case 0x43:
			arr = PC.appendInstructionNoOperands(byteArr, index, "INC BX");
			break;
		case 0x44:
			arr = PC.appendInstructionNoOperands(byteArr, index, "INC SP");
			break;
		case 0x45:
			arr = PC.appendInstructionNoOperands(byteArr, index, "INC BP");
			break;
		case 0x46:
			arr = PC.appendInstructionNoOperands(byteArr, index, "INC SI");
			break;
		case 0x47:
			arr = PC.appendInstructionNoOperands(byteArr, index, "INC DI");
			break;
		case 0x48:
			arr = PC.appendInstructionNoOperands(byteArr, index, "DEC AX");
			break;
		case 0x49:
			arr = PC.appendInstructionNoOperands(byteArr, index, "DEC CX");
			break;
		case 0x4A:
			arr = PC.appendInstructionNoOperands(byteArr, index, "DEC DX");
			break;
		case 0x4B:
			arr = PC.appendInstructionNoOperands(byteArr, index, "DEC BX");
			break;
		case 0x4C:
			arr = PC.appendInstructionNoOperands(byteArr, index, "DEC SP");
			break;
		case 0x4D:
			arr = PC.appendInstructionNoOperands(byteArr, index, "DEC BP");
			break;
		case 0x4E:
			arr = PC.appendInstructionNoOperands(byteArr, index, "DEC SI");
			break;
		case 0x4F:
			arr = PC.appendInstructionNoOperands(byteArr, index, "DEC DI");
			break;
		case 0x50:
			arr = PC.appendInstructionNoOperands(byteArr, index, "PUSH AX");
			break;
		case 0x51:
			arr = PC.appendInstructionNoOperands(byteArr, index, "PUSH CX");
			break;
		case 0x52:
			arr = PC.appendInstructionNoOperands(byteArr, index, "PUSH DX");
			break;
		case 0x53:
			arr = PC.appendInstructionNoOperands(byteArr, index, "PUSH BX");
			break;
		case 0x54:
			arr = PC.appendInstructionNoOperands(byteArr, index, "PUSH SP");
			break;
		case 0x55:
			arr = PC.appendInstructionNoOperands(byteArr, index, "PUSH BP");
			break;
		case 0x56:
			arr = PC.appendInstructionNoOperands(byteArr, index, "PUSH SI");
			break;
		case 0x57:
			arr = PC.appendInstructionNoOperands(byteArr, index, "PUSH DI");
			break;
		case 0x58:
			arr = PC.appendInstructionNoOperands(byteArr, index, "POP AX");
			break;
		case 0x59:
			arr = PC.appendInstructionNoOperands(byteArr, index, "POP CX");
			break;
		case 0x5A:
			arr = PC.appendInstructionNoOperands(byteArr, index, "POP DX");
			break;
		case 0x5B:
			arr = PC.appendInstructionNoOperands(byteArr, index, "POP BX");
			break;
		case 0x5C:
			arr = PC.appendInstructionNoOperands(byteArr, index, "POP SP");
			break;
		case 0x5D:
			arr = PC.appendInstructionNoOperands(byteArr, index, "POP BP");
			break;
		case 0x5E:
			arr = PC.appendInstructionNoOperands(byteArr, index, "POP SI");
			break;
		case 0x5F:
			arr = PC.appendInstructionNoOperands(byteArr, index, "POP DI");
			break;
		case 0x60:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x61:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x62:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x63:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x64:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x65:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x66:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x67:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x68:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "PUSH", 2);
			break;
		case 0x69:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "IMUL", 0, 1, undefined, 3);
			break;
		case 0x6A:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "PUSH", 1);
			break;
		case 0x6B:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "IMUL", 0, 0, undefined, 3);
			break;
		case 0x6C:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x6D:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x6E:
			arr = PC.appendInstructionNoOperands(byteArr, index, "OUTB");
			break;
		case 0x6F:
			arr = PC.appendInstructionNoOperands(byteArr, index, "OUTW");
			break;
		case 0x70:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JO", 1, undefined, 2);
			break;
		case 0x71:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JNO", 1, undefined, 2);
			break;
		case 0x72:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JB", 1, undefined, 2);
			break;
		case 0x73:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JNB", 1, undefined, 2);
			break;
		case 0x74:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JZ", 1, undefined, 2);
			break;
		case 0x75:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JNZ", 1, undefined, 2);
			break;
		case 0x76:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JBE", 1, undefined, 2);
			break;
		case 0x77:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JA", 1, undefined, 2);
			break;
		case 0x78:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JS", 1, undefined, 2);
			break;
		case 0x79:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JNS", 1, undefined, 2);
			break;
		case 0x7A:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JPE", 1, undefined, 2);
			break;
		case 0x7B:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JPO", 1, undefined, 2);
			break;
		case 0x7C:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JL", 1, undefined, 2);
			break;
		case 0x7D:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JGE", 1, undefined, 2);
			break;
		case 0x7E:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JLE", 1, undefined, 2);
			break;
		case 0x7F:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JG", 1, undefined, 2);
			break;
		case 0x80: case 0x81: case 0x83:
			word = ((values[0] & 0x03) == 1) ? 1 : 0;
			if((modRMR = PC.tryToGet(byteArr, index + 1)) == null)
			{
				arr = [0, PC.appendDB(byteArr, index, 1)];
			}
			else
			{
				n = (modRMR & 0x38) >>> 3;
				
				var logicalOperation = false;
				switch(n)
				{
				case 0:
					instruction = "ADD";
					break;
				case 1:
					instruction = "OR";
					logicalOperation = true;
					break;
				case 2:
					instruction = "ADC";
					break;
				case 3:
					instruction = "SBB";
					break;
				case 4:
					instruction = "AND";
					logicalOperation = true;
					break;
				case 5:
					instruction = "SUB";
					break;
				case 6:
					instruction = "XOR";
					logicalOperation = true;
					break;
				case 7:
					instruction = "CMP";
					break;
				}
				
				if(values[0] == 0x83 && logicalOperation)
				{
					arr = [1, PC.appendDB(byteArr, index, 2)];
				}
				else
				{
					arr = PC.appendInstructionWithMODRMR(byteArr, index, instruction, 0, word, undefined, 2, n);
				}
			}
			break;
		case 0x82:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0x84:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "TEST", 0, 0, undefined, 2);
			break;
		case 0x85:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "TEST", 0, 1, undefined, 2);
			break;
		case 0x86:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, 'XCHG', 0, 0, undefined, 2);
			break;
		case 0x87:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, 'XCHG', 0, 1, undefined, 2);
			break;
		case 0x88:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, 'MOV', 0, 0, undefined, 2);
			break;
		case 0x89:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, 'MOV', 0, 1, undefined, 2);
			break;
		case 0x8A:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, 'MOV', 1, 0, undefined, 2);
			break;
		case 0x8B:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, 'MOV', 1, 1, undefined, 2);
			break;
		case 0x8C:
			if((modRMR = PC.tryToGet(byteArr, index + 1)) == null)
			{
				arr = [0, PC.appendDB(byteArr, index, 1)];
			}
			else
			{
				n = (modRMR & 0x38) >>> 3;
				arr = PC.appendInstructionWithMODRMR(byteArr, index, 'MOV', 0, 1, n, 2, n);
			}
			break;
		case 0x8D:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "LEA", 0, 1, 0, 2);
			break;
		case 0x8E:
			if((modRMR = PC.tryToGet(byteArr, index + 1)) == null)
			{
				arr = [0, PC.appendDB(byteArr, index, 1)];
			}
			else
			{
				n = (modRMR & 0x38) >>> 3;
				arr = PC.appendInstructionWithMODRMR(byteArr, index, "MOV", 1, 1, n, 2, n);
			}
			break;
		case 0x8F:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "POP", 0, 1, undefined, 1);
			break;
		case 0x90:
			arr = PC.appendInstructionNoOperands(byteArr, index, "NOP");
			break;
		case 0x91:
			arr = PC.appendInstructionNoOperands(byteArr, index, "XCHG\tAX, CX");
			break;
		case 0x92:
			arr = PC.appendInstructionNoOperands(byteArr, index, "XCHG\tAX, DX");
			break;
		case 0x93:
			arr = PC.appendInstructionNoOperands(byteArr, index, "XCHG\tAX, BX");
			break;
		case 0x94:
			arr = PC.appendInstructionNoOperands(byteArr, index, "XCHG\tAX, SP");
			break;
		case 0x95:
			arr = PC.appendInstructionNoOperands(byteArr, index, "XCHG\tAX, BP");
			break;
		case 0x96:
			arr = PC.appendInstructionNoOperands(byteArr, index, "XCHG\tAX, SI");
			break;
		case 0x97:
			arr = PC.appendInstructionNoOperands(byteArr, index, "XCHG\tAX, DI");
			break;
		case 0x98:
			arr = PC.appendInstructionNoOperands(byteArr, index, "CBW");
			break;
		case 0x99:
			arr = PC.appendInstructionNoOperands(byteArr, index, "CWD");
			break;
		case 0x9A:
			arr = PC.appendInstructionOneOperand(byteArr, index, "CALL", 4, true);
			break;
		case 0x9B:
			arr = PC.appendInstructionNoOperands(byteArr, index, "WAIT");
			break;
		case 0x9C:
			arr = PC.appendInstructionNoOperands(byteArr, index, "PUSHF");
			break;
		case 0x9D:
			arr = PC.appendInstructionNoOperands(byteArr, index, "POPF");
			break;
		case 0x9E:
			arr = PC.appendInstructionNoOperands(byteArr, index, "SAHF");
			break;
		case 0x9F:
			arr = PC.appendInstructionNoOperands(byteArr, index, "LAHF");
			break;
		case 0xA0:
			arr = PC.appendInstructionOneOperand(byteArr, index, "MOV\tAL", 2);
			break;
		case 0xA1:
			arr = PC.appendInstructionOneOperand(byteArr, index, "MOV\tAX", 2);
			break;
		case 0xA2:
			arr = PC.appendInstructionOneOperand(byteArr, index, "MOV", 2);
			break;
		case 0xA3:
			arr = PC.appendInstructionOneOperand(byteArr, index, "MOV", 2);
			break;
		case 0xA4:
			arr = PC.appendInstructionNoOperands(byteArr, index, "MOVB");
			break;
		case 0xA5:
			arr = PC.appendInstructionNoOperands(byteArr, index, "MOVW");
			break;
		case 0xA6:
			arr = PC.appendInstructionNoOperands(byteArr, index, "CMPB");
			break;
		case 0xA7:
			arr = PC.appendInstructionNoOperands(byteArr, index, "CMPW");
			break;
		case 0xA8:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "TEST\tAL", 1);
			break;
		case 0xA9:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "MOV\tAX", 2);
			break;
		case 0xAA:
			arr = PC.appendInstructionNoOperands(byteArr, index, "STOSB");
			break;
		case 0xAB:
			arr = PC.appendInstructionNoOperands(byteArr, index, "STOSW");
			break;
		case 0xAC:
			arr = PC.appendInstructionNoOperands(byteArr, index, "LODB");
			break;
		case 0xAD:
			arr = PC.appendInstructionNoOperands(byteArr, index, "LODW");
			break;
		case 0xAE:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0xAF:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0xB0:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "MOV\tAL,", 1, undefined, 1);
			break;
		case 0xB1:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "MOV\tCL,", 1, undefined, 1);
			break;
		case 0xB2:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "MOV\tDL,", 1, undefined, 1);
			break;
		case 0xB3:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "MOV\tBL,", 1, undefined, 1);
			break;
		case 0xB4:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "MOV\tAH,", 1, undefined, 1);
			break;
		case 0xB5:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "MOV\tCH,", 1, undefined, 1);
			break;
		case 0xB6:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "MOV\tDH,", 1, undefined, 1);
			break;
		case 0xB7:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "MOV\tBH,", 1, undefined, 1);
			break;
		case 0xB8:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "MOV\tAX,", 2, undefined, 1);
			break;
		case 0xB9:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "MOV\tCX,", 2, undefined, 1);
			break;
		case 0xBA:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "MOV\tDX,", 2, undefined, 1);
			break;
		case 0xBB:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "MOV\tBX,", 2, undefined, 1);
			break;
		case 0xBC:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "MOV\tSP,", 2, undefined, 1);
			break;
		case 0xBD:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "MOV\tBP,", 2, undefined, 1);
			break;
		case 0xBE:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "MOV\tSI,", 2, undefined, 1);
			break;
		case 0xBF:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "MOV\tDI,", 2, undefined, 1);
			break;
		case 0xC0:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "RCL", 0, 0, undefined, 2, 2);
			break;
		case 0xC1:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0xC2:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "RET", 2);
			break;
		case 0xC3:
			arr = PC.appendInstructionNoOperands(byteArr, index, "RET");
			break;
		case 0xC4:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, 'LES', 0, 1, undefined, 2);
			break;
		case 0xC5:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, 'LDS', 0, 1, undefined, 2);
			break;
		case 0xC6:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, 'MOV', 0, 0, undefined, 2, 0);
			break;
		case 0xC7:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, 'MOV', 0, 1, undefined, 2, 0);
			break;
		case 0xC8:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0xC9:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0xCA:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "RET", 2);
			break;
		case 0xCB:
			arr = PC.appendInstructionNoOperands(byteArr, index, "RETF");
			break;
		case 0xCC:
			arr = PC.appendInstructionNoOperands(byteArr, index, "INT 3");
			break;
		case 0xCD:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "INT", 1);
			break;
		case 0xCE:
			arr = PC.appendInstructionNoOperands(byteArr, index, "INTO");
			break;
		case 0xCF:
			arr = PC.appendInstructionNoOperands(byteArr, index, "IRET");
			break;
		case 0xD0: case 0xD1: case 0xD2: case 0xD3:
			var dbAdded = false;
			w = values[0] & 0x01;
			if((modRMR = PC.tryToGet(byteArr, index + 1)) == null)
			{
				arr = [0, PC.appendDB(byteArr, index, 1)];
			}
			else
			{
				n = (modRMR & 0x38) >>> 3;
				switch(n)
				{
				case 0:
					instruction = "ROL";
					break;
				case 1:
					instruction = "ROR";
					break;
				case 2:
					instruction = "RCL";
					break;
				case 3:
					instruction = "RCR";
					break;
				case 4:
					instruction = "SHL";
					break;
				case 5:
					instruction = "SHR";
					break;
				case 6:
					instruction = "RCR";
					break;
				case 7:
					instruction = "SAR";
					break;
				}
			}
			
			arr = PC.appendInstructionWithMODRMR(byteArr, index, instruction, 0, w, undefined, 1, n);
			if(values[0] == 0xD2 || values[0] == 0xD3)
			{
				arr[1] += ", CL";
			}
			break;
		case 0xD4:
			arr = PC.appendInstructionNoOperands(byteArr, index, "AAM", [0x0A]);
			break;
		case 0xD5:
			arr = PC.appendInstructionNoOperands(byteArr, index, "AAD", [0x0A]);
			break;
		case 0xD6:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0xD7:
			arr = PC.appendInstructionNoOperands(byteArr, index, "XLATB");
			break;
		case 0xD8:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "ESC", 0, 1, undefined, 2);
			break;
		case 0xD9:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "ESC", 0, 1, undefined, 2);
			break;
		case 0xDA:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "ESC", 0, 1, undefined, 2);
			break;
		case 0xDB:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "ESC", 0, 1, undefined, 2);
			break;
		case 0xDC:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "ESC", 0, 1, undefined, 2);
			break;
		case 0xDD:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "ESC", 0, 1, undefined, 2);
			break;
		case 0xDE:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "ESC", 0, 1, undefined, 2);
			break;
		case 0xDF:
			arr = PC.appendInstructionWithMODRMR(byteArr, index, "ESC", 0, 1, undefined, 2);
			break;
		case 0xE0:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "LOOPNE", 1);
			break;
		case 0xE1:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "LOOPE", 1);
			break;
		case 0xE2:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "LOOP", 1, 2, 3);
			break;
		case 0xE3:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JCXZ", 1);
			break;
		case 0xE4:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "IN\tAL,", 1, undefined, 1);
			break;
		case 0xE5:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "IN\tAX,", 1, undefined, 1);
			break;
		case 0xE6:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "OUTB", 1);
			break;
		case 0xE7:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "OUTW", 1);
			break;
		case 0xE8:
			arr = PC.appendInstructionOneOperand(byteArr, index, "CALL", 2, true);
			break;
		case 0xE9:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JMP", 2, undefined, 3);
			break;
		case 0xEA:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JMP", 4, undefined, 0);
			break;
		case 0xEB:
			arr = PC.appendInstructionWithImmediateValue(byteArr, index, "JMP", 1);
			break;
		case 0xEC:
			arr = PC.appendInstructionNoOperands(byteArr, index, "IN AL, DX");
			break;
		case 0xED:
			arr = PC.appendInstructionNoOperands(byteArr, index, "IN AX, DX");
			break;
		case 0xEE:
			arr = PC.appendInstructionNoOperands(byteArr, index, "OUTB\tDX");
			break;
		case 0xEF:
			arr = PC.appendInstructionNoOperands(byteArr, index, "OUTB\tDX");
			break;
		case 0xF0:
			arr = PC.appendInstructionNoOperands(byteArr, index, "LOCK");
			break;
		case 0xF1:
			arr = [0, PC.appendDB(byteArr, index, 1)];
			break;
		case 0xF2:
			arr = PC.appendInstructionNoOperands(byteArr, index, "REPNZ");
			break;
		case 0xF3:
			arr = PC.appendInstructionNoOperands(byteArr, index, "REPZ");
			break;
		case 0xF4:
			arr = PC.appendInstructionNoOperands(byteArr, index, "HLT");
			break;
		case 0xF5:
			arr = PC.appendInstructionNoOperands(byteArr, index, "CMC");
			break;
		case 0xF6: case 0xF7:
			var dbAdded = false;
			w = values[0] & 0x01;
			if((modRMR = PC.tryToGet(byteArr, index + 1)) == null)
			{
				arr = [0, PC.appendDB(byteArr, index, 1)];
			}
			else
			{
				n = (modRMR & 0x38) >>> 3;
				switch(n)
				{
				case 0:
					instruction = "TEST";
					break;
				case 2:
					instruction = "NOT";
					break;
				case 3:
					instruction = "NEG";
					break;
				case 4:
					instruction = "MUL";
					break;
				case 5:
					instruction = "IMUL";
					break;
				case 6:
					instruction = "DIV";
					break;
				case 7:
					instruction = "IDIV";
					break
				default:
					arr = [1, PC.appendDB(byteArr, index, 2)];
					dbAdded = true;
					break;
				}
			}
			
			if(!dbAdded)
			{
				arr = PC.appendInstructionWithMODRMR(byteArr, index, instruction, 0, word, undefined, 1, n);
			}
			break;
		case 0xF8:
			arr = PC.appendInstructionNoOperands(byteArr, index, "CLC");
			break;
		case 0xF9:
			arr = PC.appendInstructionNoOperands(byteArr, index, "STC");
			break;
		case 0xFA:
			arr = PC.appendInstructionNoOperands(byteArr, index, "CLI");
			break;
		case 0xFB:
			arr = PC.appendInstructionNoOperands(byteArr, index, "STI");
			break;
		case 0xFC:
			arr = PC.appendInstructionNoOperands(byteArr, index, "CLD");
			break;
		case 0xFD:
			arr = PC.appendInstructionNoOperands(byteArr, index, "STD");
			break;
		case 0xFE:
			if((modRMR = PC.tryToGet(byteArr, index + 1)) == null)
			{
				arr = [0, PC.appendDB(byteArr, index, 1)];
			}
			else
			{
				n = (modRMR & 0x38) >>> 3;
				switch(n)
				{
				case 0:
					instruction = "INC";
					break;
				case 1:
					instruction = "DEC";
					break;
				default:
					instruction = "???";
					break;
				}
			}
			
			arr = PC.appendInstructionWithMODRMR(byteArr, index, instruction, 0, 0, undefined, 1, n);
			break;
		case 0xFF:
			if((modRMR = PC.tryToGet(byteArr, index + 1)) == null)
			{
				arr = [0, PC.appendDB(byteArr, index, 1)];
			}
			else
			{
				n = (modRMR & 0x38) >>> 3;
				switch(n)
				{
				case 0:
					instruction = "INC";
					break;
				case 1:
					instruction = "DEC";
					break;
				case 2: case 3:
					instruction = "CALL";
					break;
				case 4:
					instruction = "JMP";
					break;
				case 5:
					instruction = "JMP";
					break;
				case 6:
					instruction = "PUSH";
					break;
				default:
					instruction = "???";
					break;
				}
			}
			
			arr = PC.appendInstructionWithMODRMR(byteArr, index, instruction, 0, 1, undefined, 1, n);
			break;
		}
		
		result += arr[1] + "\n";
		index += arr[0] + 1;
	}
	
	return result;
};

PC.$8088._disassembly = function(event)
{
	var eventTarget = getEventTarget(event);
	var pc = parseInt($('pc').value, 16);

	var div = document.createElement('div');
	var text = document.createElement('textarea');
	
	text.value = PC._disasm(PC.mem, pc, pc + 256 > 0xFFFFF ? 0xFFFFF : pc + 256);
	text.style.width = '80%';
	text.style.height = '80%';
	text.style.margin = 'auto';
	
	div.id = 'disassembly';
	div.appendChild(text);
	div.style.position = 'absolute';
	div.style.backgroundColor = 'white';
	div.style.border = 'solid 1px';
	div.style.width = '400px';
	div.style.height = '400px';
	div.style.left = '50%';
	div.style.top = '50%';
	div.style.marginLeft = '-25%';
	div.style.marginTop = '-25%';
	div.style.padding = '5px';
	
	div.onkeydown = function(event)
	{
		var eventTarget = getEventTarget(event);
		
		if(eventTarget.event.keyCode == 0x27)
		{
			document.body.removeChild($("disassembly"));
		}
	};
	
	div.appendChild($_('br'));
	
	var close = document.createElement('input');
	close.type = 'submit';
	close.value = 'Close';
	close.style.margin = 'auto';
	close.onclick = function()
	{
		document.body.removeChild($('disassembly'));
	};
	
	div.appendChild(close);
	
	document.body.appendChild(div);
};
