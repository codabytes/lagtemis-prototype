import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const csvData = `LA-2023-0001,Adebayo,Olatunji,Olu,LASCO/22/001,Male,4/15/2001,8012345001,adebayo.o@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,dGLfl8x8JB39eyWTtzSD,DWjX6ELYCpUaWHRfhcex,Enrolled,
LA-2023-0002,Chioma,Okafor,Joy,LASCO/22/002,Female,5/20/2002,8123456002,chioma.o@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,IffTxMKa5pP1L8aPov4B,CSHdyJiNw8pk787kJDnv,Enrolled,
LA-2023-0003,Yusuf,Ibrahim,Aliyu,LASCO/22/003,Male,11/10/1999,9034567003,yusuf.i@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Part-time,dGLfl8x8JB39eyWTtzSD,DWjX6ELYCpUaWHRfhcex,Enrolled,
LA-2023-0004,Amina,Bello,Zainab,LASCO/22/004,Female,1/25/2003,7045678004,amina.b@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,IffTxMKa5pP1L8aPov4B,CSHdyJiNw8pk787kJDnv,Enrolled,
LA-2023-0005,Emeka,Eze,Chinedu,LASCO/22/005,Male,8/30/2000,8056789005,emeka.e@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Part-time,dGLfl8x8JB39eyWTtzSD,DWjX6ELYCpUaWHRfhcex,Enrolled,
LA-2023-0006,Oluwaseun,Adeyemi,Grace,LASCO/22/006,Female,12/14/2001,8167890006,oluwaseun.a@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,IffTxMKa5pP1L8aPov4B,CSHdyJiNw8pk787kJDnv,Enrolled,
LA-2023-0007,Abubakar,Musa,Sadiq,LASCO/22/007,Male,2/18/1998,9078901007,abubakar.m@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,dGLfl8x8JB39eyWTtzSD,DWjX6ELYCpUaWHRfhcex,Enrolled,
LA-2023-0008,Ngozi,Nwachukwu,Blessing,LASCO/22/008,Female,9/5/2002,7089012008,ngozi.n@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Sandwich,IffTxMKa5pP1L8aPov4B,CSHdyJiNw8pk787kJDnv,Enrolled,
LA-2023-0009,Tunde,Bakare,Samuel,LASCO/22/009,Male,3/22/2000,8090123009,tunde.b@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,dGLfl8x8JB39eyWTtzSD,DWjX6ELYCpUaWHRfhcex,Enrolled,
LA-2023-0010,Fatima,Abdullahi,Aisha,LASCO/22/010,Female,7/11/2004,8101234010,fatima.a@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,IffTxMKa5pP1L8aPov4B,CSHdyJiNw8pk787kJDnv,Enrolled,
LA-2023-0011,David,Okoro,Chukwuemeka,LASCO/22/011,Male,10/9/2001,9012345011,david.o@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Part-time,KdmVyifOdg6TBLSQMQE5,B5khS2gyQMuudnV8uLYp,Enrolled,
LA-2023-0012,Ruth,Edet,Etim,LASCO/22/012,Female,4/16/2003,7023456012,ruth.e@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,KW7P3IAmuIF8UfA732bn,UsQcLDDsZIOunQFppdNR,Enrolled,
LA-2023-0013,Samuel,Lawal,Olamide,LASU/23/001,Male,1/20/2001,8034567013,samuel.l@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Full-time,IBfNa7nUxsRLjrL3L8Cg,JX0b6qIu1SP15lzNOMLC,Enrolled,
LA-2023-0014,Joy,Ajayi,Tolulope,LASU/23/002,Female,6/15/2002,8145678014,joy.a@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Full-time,tdhfXwI3QOGiX2vEgBw1,vWe424ObhwZcVN1eMJ9v,Enrolled,
LA-2023-0015,Emmanuel,Uche,Chijioke,LASU/23/003,Male,12/5/1999,9056789015,emmanuel.u@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Part-time,IBfNa7nUxsRLjrL3L8Cg,JX0b6qIu1SP15lzNOMLC,Enrolled,
LA-2023-0016,Grace,Ogundipe,Titilayo,LASU/23/004,Female,2/28/2003,7067890016,grace.o@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Full-time,tdhfXwI3QOGiX2vEgBw1,vWe424ObhwZcVN1eMJ9v,Enrolled,
LA-2023-0017,Kolawole,Adekunle,Temitope,LASU/23/005,Male,9/12/2000,8078901017,kolawole.a@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Full-time,IBfNa7nUxsRLjrL3L8Cg,JX0b6qIu1SP15lzNOMLC,Enrolled,
LA-2023-0018,Mary,Chukwuma,Ifunanya,LASU/23/006,Female,11/23/2001,8189012018,mary.c@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Full-time,tdhfXwI3QOGiX2vEgBw1,vWe424ObhwZcVN1eMJ9v,Enrolled,
LA-2023-0019,Aliyu,Danjuma,Umar,LASU/23/007,Male,5/8/1998,9090123019,aliyu.d@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Part-time,IBfNa7nUxsRLjrL3L8Cg,JX0b6qIu1SP15lzNOMLC,Enrolled,
LA-2023-0020,Esther,Olayinka,Bukola,LASU/23/008,Female,10/17/2002,7001234020,esther.o@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Sandwich,tdhfXwI3QOGiX2vEgBw1,vWe424ObhwZcVN1eMJ9v,Enrolled,
LA-2023-0021,Michael,Afolabi,Olumide,LASU/23/009,Male,4/4/2000,8012345021,michael.a@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Epe,Full-time,kv2uxjfEqOeB5Pyw2RFm,zIiiQIeAyMm29LyFDxd2,Enrolled,
LA-2023-0022,Sarah,Ikenna,Chizoba,LASU/23/010,Female,8/21/2004,8123456022,sarah.i@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Epe,Full-time,kv2uxjfEqOeB5Pyw2RFm,a5rQHT9XXh8O5CBfXiiN,Enrolled,
LA-2023-0023,Victor,Ademola,Kehinde,LASU/23/011,Male,7/14/2001,9034567023,victor.a@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Full-time,BPbYyzQDo6HdXL8rupoR,SDL3qZCwG3APhPeSG1YY,Enrolled,
LA-2023-0024,Mercy,Oladipo,Favour,LASU/23/012,Female,3/30/2003,7045678024,mercy.o@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Full-time,BPbYyzQDo6HdXL8rupoR,3c9TxLTuaCvbo2q05wgM,Enrolled,
LA-2023-0025,Daniel,Balogun,Ayodeji,LASUCOM/21/001,Male,1/11/1999,8056789025,daniel.b@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,xI5e0YceIWH2OWBwNERZ,dZVN7NyHXprhDN7Uja2n,Enrolled,
LA-2023-0026,Victoria,Nwankwo,Chiamaka,LASUCOM/21/002,Female,6/25/2000,8167890026,victoria.n@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,6AAQ6Ml3udCBYuFAdf5d,CzDBDvR5rTkjLNHkGvMy,Enrolled,
LA-2023-0027,Ibrahim,Salisu,Kabir,LASUCOM/21/003,Male,11/3/1998,9078901027,ibrahim.s@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,xI5e0YceIWH2OWBwNERZ,dZVN7NyHXprhDN7Uja2n,Enrolled,
LA-2023-0028,Juliet,Adebowale,Yetunde,LASUCOM/21/004,Female,2/19/2001,7089012028,juliet.a@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,6AAQ6Ml3udCBYuFAdf5d,CzDBDvR5rTkjLNHkGvMy,Enrolled,
LA-2023-0029,John,Okeke,Obinna,LASUCOM/21/005,Male,8/7/2000,8090123029,john.o@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,xI5e0YceIWH2OWBwNERZ,dZVN7NyHXprhDN7Uja2n,Enrolled,
LA-2023-0030,Florence,Coker,Omotola,LASUCOM/21/006,Female,12/31/2002,8101234030,florence.c@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,6AAQ6Ml3udCBYuFAdf5d,CzDBDvR5rTkjLNHkGvMy,Enrolled,
LA-2023-0031,Peter,Ogunleye,Sunday,LASUCOM/21/007,Male,3/14/1997,9012345031,peter.o@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,xI5e0YceIWH2OWBwNERZ,VoESoPL6RmT0h2SGAyHH,Enrolled,
LA-2023-0032,Alice,Ezeani,Nkechi,LASUCOM/21/008,Female,9/22/2003,7023456032,alice.e@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,6AAQ6Ml3udCBYuFAdf5d,ysKFrKBqLxvQHxyr2Jb1,Enrolled,
LA-2023-0033,Moses,Olayemi,Taiwo,LASUCOM/21/009,Male,5/6/2001,8034567033,moses.o@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,xI5e0YceIWH2OWBwNERZ,dZVN7NyHXprhDN7Uja2n,Enrolled,
LA-2023-0034,Gloria,Adebiyi,Kemi,LASUCOM/21/010,Female,1/18/2004,8145678034,gloria.a@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,6AAQ6Ml3udCBYuFAdf5d,CzDBDvR5rTkjLNHkGvMy,Enrolled,
LA-2023-0035,Paul,Nnaji,Chukwudi,LASUCOM/21/011,Male,10/29/1999,9056789035,paul.n@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,xI5e0YceIWH2OWBwNERZ,dZVN7NyHXprhDN7Uja2n,Enrolled,
LA-2023-0036,Helen,Olatunbosun,Bose,LASUCOM/21/012,Female,4/12/2002,7067890036,helen.o@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,6AAQ6Ml3udCBYuFAdf5d,CzDBDvR5rTkjLNHkGvMy,Enrolled,
LA-2023-0037,Stephen,Oluwasegun,Damilare,LASTECH/24/001,Male,8/5/2001,8078901037,stephen.o@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Full-time,FSRZ6o3ilrdEyUJDvkMp,SY9eqlwAcYpRJqHplZJC,Enrolled,
LA-2023-0038,Cynthia,Ibekwe,Onyinye,LASTECH/24/002,Female,11/16/2003,8189012038,cynthia.i@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Full-time,rcrzL3nmpb9cGupjjYM8,Xs6Dei4NU2Y77Qig6Ymt,Enrolled,
LA-2023-0039,Charles,Adeola,Mayowa,LASTECH/24/003,Male,2/27/2000,9090123039,charles.a@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Part-time,FSRZ6o3ilrdEyUJDvkMp,SY9eqlwAcYpRJqHplZJC,Enrolled,
LA-2023-0040,Lydia,Ogunlana,Peju,LASTECH/24/004,Female,7/8/2002,7001234040,lydia.o@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Full-time,rcrzL3nmpb9cGupjjYM8,Xs6Dei4NU2Y77Qig6Ymt,Enrolled,
LA-2023-0041,Henry,Ojo,Babatunde,LASTECH/24/005,Male,12/20/1998,8012345041,henry.o@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Part-time,FSRZ6o3ilrdEyUJDvkMp,SY9eqlwAcYpRJqHplZJC,Enrolled,
LA-2023-0042,Dorcas,Ayeni,Folashade,LASTECH/24/006,Female,5/2/2004,8123456042,dorcas.a@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Full-time,rcrzL3nmpb9cGupjjYM8,4TVYos56o9xLYgz2D2ta,Enrolled,
LA-2023-0174,Jide,Olorunfemi,Tunde,LASCON/24/001,Male,2/14/2001,8011112222,jide.o@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Enrolled,
LA-2023-0175,Musa,Ibrahim,Aliyu,LASCON/24/002,Male,7/22/1999,8122223333,musa.i@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,Enrolled,
LA-2023-0176,Chinedu,Okafor,Emeka,LASCON/24/003,Male,11/5/2002,9033334444,chinedu.o@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,TinYumBMKgdjdSsGm593,Enrolled,
LA-2023-0177,Abdullahi,Bello,Sani,LASCON/24/004,Male,4/18/2000,7044445555,abdullahi.b@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Part-time,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Enrolled,
LA-2023-0178,Femi,Adeyemi,Oladapo,LASCON/24/005,Male,9/30/1998,8055556666,femi.a@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,Enrolled,
LA-2023-0179,Emeka,Eze,Ugochukwu,LASCON/24/006,Male,1/12/2003,8166667777,emeka.e@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,TinYumBMKgdjdSsGm593,Enrolled,
LA-2023-0180,Kunle,Balogun,Ayomide,LASCON/24/007,Male,8/25/2001,9077778888,kunle.b@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Enrolled,
LA-2023-0181,Sadiq,Abubakar,Umar,LASCON/24/008,Male,12/8/1999,7088889999,sadiq.a@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Part-time,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,Enrolled,
LA-2023-0182,Obinna,Nwosu,Kalu,LASCON/24/009,Male,5/19/2002,8099990000,obinna.n@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,TinYumBMKgdjdSsGm593,Enrolled,
LA-2023-0183,Taiwo,Ojo,Kehinde,LASCON/24/010,Male,10/3/2000,8101010101,taiwo.o@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Enrolled,
LA-2023-0184,Kehinde,Ojo,Taiwo,LASCON/24/011,Male,10/3/2000,9012121212,kehinde.o@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,Enrolled,
LA-2023-0185,Segun,Alabi,Babatunde,LASCON/24/012,Male,3/27/2003,7023232323,segun.a@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Part-time,iN0J9OpnKABEflgJ5axS,TinYumBMKgdjdSsGm593,Enrolled,
LA-2023-0186,Umar,Danjuma,Farouq,LASCON/24/013,Male,7/14/2001,8034343434,umar.d@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Enrolled,
LA-2023-0187,Ebube,Nwachukwu,Chidi,LASCON/24/014,Male,11/21/1998,8145454545,ebube.n@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,Enrolled,
LA-2023-0188,Tare,Preye,Ebikeme,LASCON/24/015,Male,6/9/2002,9056565656,tare.p@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,TinYumBMKgdjdSsGm593,Enrolled,
LA-2023-0189,Idris,Usman,Kabir,LASCON/24/016,Male,2/28/2000,7067676767,idris.u@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Part-time,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Enrolled,
LA-2023-0190,Akin,Adelabu,Oladapo,LASCON/24/017,Male,9/16/2004,8078787878,akin.a@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,Enrolled,
LA-2023-0191,Chukwudi,Okeke,Ikenna,LASCON/24/018,Male,4/4/1999,8189898989,chukwudi.o@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,TinYumBMKgdjdSsGm593,Enrolled,
LA-2023-0192,Wasiu,Gbadamosi,Alade,LASCON/24/019,Male,12/11/2003,9090909090,wasiu.g@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Enrolled,
LA-2023-0193,Haruna,Yusuf,Isa,LASCON/24/020,Male,8/2/2001,7012123434,haruna.y@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Part-time,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,Enrolled,
LA-2023-0194,Nnamdi,Uba,Chibuzor,LASCON/24/021,Male,5/27/1998,8023234545,nnamdi.u@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,TinYumBMKgdjdSsGm593,Enrolled,
LA-2023-0195,Wale,Adebayo,Sunday,LASCON/24/022,Male,10/15/2002,8134345656,wale.a@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Enrolled,
LA-2023-0196,Amina,Suleiman,Zainab,LASCON/24/023,Female,1/9/2000,9045456767,amina.s@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,Enrolled,
LA-2023-0197,Chioma,Okoro,Nkechi,LASCON/24/024,Female,7/20/2004,7056567878,chioma.o@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Part-time,iN0J9OpnKABEflgJ5axS,TinYumBMKgdjdSsGm593,Enrolled,
LA-2023-0198,Fatima,Aliyu,Hauwa,LASCON/24/025,Female,3/5/1999,8067678989,fatima.a@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Enrolled,
LA-2023-0199,Blessing,Edet,Eno,LASCON/24/026,Female,11/18/2001,8178789090,blessing.e@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,Enrolled,
LA-2023-0200,Nkechi,Chukwuma,Ogechi,LASCON/24/027,Female,4/29/2003,9089890101,nkechi.c@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,TinYumBMKgdjdSsGm593,Enrolled,
LA-2023-0201,Aisha,Umar,Maryam,LASCON/24/028,Female,8/11/1998,7090901212,aisha.u@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Part-time,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Enrolled,
LA-2023-0202,Grace,Ogundipe,Titilayo,LASCON/24/029,Female,12/4/2002,8012122323,grace.o@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,Enrolled,
LA-2023-0203,Kemi,Adebiyi,Folashade,LASCON/24/030,Female,6/17/2000,8123233434,kemi.a@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,TinYumBMKgdjdSsGm593,Enrolled,
LA-2023-0204,Halima,Yakubu,Asmau,LASCON/24/031,Female,2/22/2004,9034344545,halima.y@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Enrolled,
LA-2023-0205,Amaka,Nnamani,Ifeoma,LASCON/24/032,Female,9/7/1999,7045455656,amaka.n@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Part-time,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,Enrolled,
LA-2023-0206,Bola,Tinubu,Yemisi,LASCON/24/033,Female,5/31/2001,8056566767,bola.t@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,TinYumBMKgdjdSsGm593,Enrolled,
LA-2023-0207,Ngozi,Nwachukwu,Chidinma,LASCON/24/034,Female,10/14/2003,8167677878,ngozi.n@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Enrolled,
LA-2023-0208,Zainab,Bello,Fatima,LASCON/24/035,Female,1/26/1998,9078788989,zainab.b@student.edu.ng,tACt0ODnc5T1edIZt17L,Igando,Full-time,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,Enrolled,`;

async function upload() {
  const lines = csvData.trim().split('\n');
  console.log(`Starting upload of ${lines.length} students...`);
  
  let count = 0;
  for (const line of lines) {
    const values = line.split(',');
    if (values.length < 15) continue;

    const student: any = {
      lasrraId: values[0].trim(),
      firstName: values[1].trim(),
      lastName: values[2].trim(),
      otherName: values[3].trim(),
      matricNumber: values[4].trim(),
      sex: values[5].trim(),
      gender: values[5].trim(),
      dob: values[6].trim(),
      dateOfBirth: values[6].trim(),
      mobilePhone: values[7].trim(),
      email: values[8].trim(),
      institutionId: values[9].trim(),
      campus: values[10].trim(),
      programmeType: values[11].trim(),
      facultyId: values[12].trim(),
      departmentId: values[13].trim(),
      enrollmentStatus: values[14].trim(),
      admissionYear: values[4].split('/')[1] ? `20${values[4].split('/')[1]}` : '2023',
      isSeed: true,
      lastUpdated: Timestamp.now()
    };

    if (student.mobilePhone.length === 10 && !student.mobilePhone.startsWith('0')) {
      student.mobilePhone = '0' + student.mobilePhone;
    }

    const studentId = student.matricNumber.trim().replace(/\//g, '_');
    await setDoc(doc(db, 'students', studentId), student);
    count++;
    if (count % 20 === 0) console.log(`Uploaded ${count} students...`);
  }

  console.log(`Upload complete. Total students updated/uploaded: ${count}`);
  process.exit(0);
}

upload().catch(err => {
  console.error(err);
  process.exit(1);
});
