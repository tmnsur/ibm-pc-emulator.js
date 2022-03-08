# ibm-pc-emulator-js
An incomplete emulator of original IBM PC. Nearly all 8088 instructions are working with the exception of IO operations. Since no IO component is emulated, IN and OUT operations are doing nothing. This also cause the original IBM PC BIOS code, which is by default loaded and executed in the emulator, to misbehave when it tries to check IO components that was inside the original PC.

But you should be able to load your own code (without IO operations) and see its result. 

https://tmnsur.github.io/ibm-pc-emulator.js/emulator.html
