const outputText = '<0f>0<|box;x1=40;y1=40;x2=119;y2=119;w=320;h=240|><|mask;x=0;y=0;data=80,80,~!!!6F#V8kWMNr?Jns0#1eU!k=pmWfP3#9d9nYaI6*VRpDBR0aCa!3Bh.M8{6w4&={Iq#JFFnr9B1ZvlYW2+:Oa@/z8^Qci4*@iTvqle1Wa(^4TZ_XAl!67)#.`R@RN&9IohdKJ*3QE]^-s`ZK+#aiDJBq%Y?_!`LfQN#t+S6K.jDBq@Kv:!AGyi#3R5E3(r.YT?O/gIPT5!/X?xw9x/BX.Sh0jQ#km!7U7FC:oqa91#]nYG]3x5cP^$5x8S.0$t#cEE/R1]{107AO0!Op/4Sgz^b_o90Qh6#t23kRBvM_*?%SV[(J!^_J_w8{qVw&ya:b[5`DbNhYepuo^D.3[Z*fV:?[6BrByH)qv.ZcOWYpDm0+6vOk:.K_0`UrPTcV@zZQ0pO9O/0-4`u4)pZolU4AEkW)hj2/FX6qV%nas^rbP-jJAB`pb2K)kWAc)S?ORY(^(N/vaF!rf&FPvh@A(_1FWEunLcapdR1.V/:`M`2/UT)wD[q/)Kb(f+lVjQz5DYg7n\'QB[?QKHtN!(ynZ8k_J[7$dX7/sc$)f!8JkQUg4P8Jr9H=^niw`%d5eolqIU.xyXJQay(i]E%(k[(fi*FxRrK18*0C5KF9NdX(_y2t5V1Op-p(m`yEnnFR+sR`:T&ABKARPqnBFDr)n+/1@Y-Hy+d&^fCHETP^pc4ZbW&)^1Wh^*-RZ{=*Q7:y5ubC&8`b6RoKgv71g!FumRQeq](x?RGa`PMwGp)+/:I#DWe1:GH3ICNL[D2kDA7VM/?h443Z$R$cEFSAM:aR/`[M^+$G{7+#&diwO:qa\'+0d22!v-t5i[FnGcrA)ghLDe^@VRg&raOhITdJnS]tNHpB1j4if%gs-y2YjusGLTkC$a_f{2C_3R%_wm&#1V.@#FALNXht5Y#vUu{#R]ZS={H_a6:]x8Er3bYwz1@w0*hd]$2@mV:Ca$tUapwz$*PpjHB`+(T\'pPS5ojPaUpAD34F^Q#q@t752Ch[dZKIvPB`JYT4B2-OPbi_0C\'t(7t&VZiB8y1fRHqm[wm7k1fQk[N_jm0+-_[@B{Be@$Irpc3S]BbW26IWsjo!rc1H/]oIUC/!X3`C72@sB3+\'\'lX1^pp5`P0OY3U0[L6&ML2SC9KZ&N]$K)v.Fn!d8[1zeZ#m12aL2o.d#QU.Vlp[[NV=#@7FeCAx@TSLSE`t/y*3^?GXAsjj*3O6q(_*BWk@zBR`P)iS^^_Fv.:O)2XEL+0$HEN(]mTetCcUH-@$4Q27Xe6:B7y$9]2=J2Obe=o1){C1IUS?UN9CX(OKwAV1`Pl(`TA]zrW{p_ftuH\'DZY?tjVyj4Q-Ox[2{O(-T1VCovNceKZt.)RQRVlT[jVoz2h{-CQr+F&3af_MUw^Bky#!J)GWh?f?UGH/aEXkxfbtHz5?EtRemsrI+55nicLj%kV+XI\'J!m+a*^x5fwLQF+:a=%-mjsKA#yrmoG2bFzR`fnk&?2NtX:e#+fPM3C]$=mlkv+ZlG!xgw1-G!0YMLLUa\'Xd4_bd4ZN(dCG$.4!2-C#I1a_x/M^S!pipS`0iH^J\'$!\'%\CqP+XCDtsWO+$ZSCyvU/gs1&6C)F0Wb*8!?*_#tFV&BiT(Bk#7-McIRP?xktmy+]ec{?[$eKvRgpC7M9.b$hwl\'.ScV[4]BwrC[?=I]MWd&=j4(kB#el2sXm&Z\'MoeQ1sS7hnSltl1j`).Y&r\'=Q($SJtQO:FkaO0h9-P1RN@tC_iSt(KXIYns`Tegrw@1_BdKB[=jl!@w@V{6E[pND-P#L3DMnDXeTZ?Oy%SBR6C.8NFeDhCZ!-Va!EP@rdF6tj%haS.+cz5qb0qdzEhc\'M46Y)fbnL/Y:!-y0!*5:_6$xy^/rKkE:+3g\'L=Z&3cw/yoLlKP!AVhvu7&RMD_C0wyJGks9wCJh)][S6Are1!_ij.psk)CzO+283Pc7nRM]w!-61wF&f*]GAWnupK0hqE_Wly$]OejL)qqBtqVdcy&r1!eB1phv/@rgO]:fDU+(U_&mHw`6E`hsEhnwV-mxLqOISFNb1jVu)wUAKeAnrV#%`.Te+As0xxWp?Zdg4ZAy`W[$ZO|>';

const frameLines = outputText.split(/(?=<(?:\d+)f>)/).filter((s) => s.trim().length > 0);
console.log('Frame lines:', frameLines.length);

const re = /(\d+)<\|box;x1=(\d+);y1=(\d+);x2=(\d+);y2=(\d+);w=(\d+);h=(\d+)(?:;c=([\d.]+))?\|>(?:<\|mask;x=0;y=0(?:;c=([\d.]+))?;data=(\d+),(\d+),([~!])(.+?)\|>)?/g;
let match;
let count = 0;
while ((match = re.exec(frameLines[0])) !== null) {
  count++;
  console.log('Match #' + count);
  console.log('  id:', match[1]);
  console.log('  box x1:', match[2], 'y1:', match[3], 'x2:', match[4], 'y2:', match[5], 'w:', match[6], 'h:', match[7]);
  console.log('  box conf:', match[8]);
  console.log('  mask conf:', match[9]);
  console.log('  mask w:', match[10], 'h:', match[11], 'enc:', match[12]);
  console.log('  payload len:', match[13] ? match[13].length : 0);
  console.log('  payload start:', match[13] ? match[13].slice(0, 30) : 'N/A');
}
if (count === 0) {
  console.log('NO MATCHES FOUND');
  const boxRe = /(\d+)<\|box;x1=(\d+);y1=(\d+);x2=(\d+);y2=(\d+);w=(\d+);h=(\d+)\|>/g;
  let m2;
  while ((m2 = boxRe.exec(frameLines[0])) !== null) {
    console.log('Box-only match:', m2[1], m2[2], m2[3], m2[4], m2[5], m2[6], m2[7]);
  }
}
