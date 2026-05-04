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
LA-2023-0101,Usman,Danladi,Musa,LASCO/22/025,Male,8/14/2001,8031234567,usman.d@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,dGLfl8x8JB39eyWTtzSD,hiTs05zK1DXJoEwXOEDH,Enrolled,
LA-2023-0102,Nnamdi,Okafor,Chukwu,LASU/23/029,Male,2/19/2003,8142345678,nnamdi.o@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Full-time,IBfNa7nUxsRLjrL3L8Cg,GdbyDv9N7ANTDIfDWmIf,Enrolled,
LA-2023-0103,Terhemen,Iorfa,Aondo,LASUCOM/21/025,Male,11/3/1999,9053456789,terhemen.i@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,xI5e0YceIWH2OWBwNERZ,J7eDgJhrgDRiwEzkRI3x,Enrolled,
LA-2023-0104,Asuquo,Bassey,Edet,LASTECH/24/025,Male,5/22/2002,7064567890,asuquo.b@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Part-time,FSRZ6o3ilrdEyUJDvkMp,J694B8RpGjCsFWBq546r,Enrolled,
LA-2023-0105,Osagie,Igbinedion,Nosakhare,LASCO/22/026,Male,9/11/2000,8075678901,osagie.i@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,IffTxMKa5pP1L8aPov4B,CSHdyJiNw8pk787kJDnv,Enrolled,
LA-2023-0106,Tari,Timipre,Ebikeme,LASU/23/030,Male,12/5/2001,8186789012,tari.t@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Epe,Full-time,kv2uxjfEqOeB5Pyw2RFm,zIiiQIeAyMm29LyFDxd2,Enrolled,
LA-2023-0107,Babatunde,Olatunji,Femi,LASUCOM/21/026,Male,4/30/1998,9097890123,babatunde.o@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,6AAQ6Ml3udCBYuFAdf5d,CzDBDvR5rTkjLNHkGvMy,Enrolled,
LA-2023-0108,Ovie,Efe,Oghenekaro,LASTECH/24/026,Male,1/15/2004,7008901234,ovie.e@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Sandwich,rcrzL3nmpb9cGupjjYM8,Xs6Dei4NU2Y77Qig6Ymt,Enrolled,
LA-2023-0109,Sani,Abba,Garba,LASCO/22/027,Male,7/8/2002,8019012345,sani.a@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,KdmVyifOdg6TBLSQMQE5,B5khS2gyQMuudnV8uLYp,Enrolled,
LA-2023-0110,Obinna,Nwosu,Kalu,LASU/23/031,Male,10/27/1999,8120123456,obinna.n@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Full-time,tdhfXwI3QOGiX2vEgBw1,0mdjsyWCnUUsoUiXax0c,Enrolled,
LA-2023-0111,Effiong,Akpan,Udoh,LASUCOM/21/027,Male,3/14/2001,9031234567,effiong.a@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,xI5e0YceIWH2OWBwNERZ,dZVN7NyHXprhDN7Uja2n,Enrolled,
LA-2023-0112,Eromosele,Okojie,Akhigbe,LASTECH/24/027,Male,8/2/2003,7042345678,eromosele.o@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Full-time,rcrzL3nmpb9cGupjjYM8,4TVYos56o9xLYgz2D2ta,Enrolled,
LA-2023-0113,Preye,Diri,Alaowei,LASCO/22/028,Male,6/19/2000,8053456789,preye.d@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Part-time,KW7P3IAmuIF8UfA732bn,UsQcLDDsZIOunQFppdNR,Enrolled,
LA-2023-0114,Olamide,Adesanya,Kunle,LASU/23/032,Male,11/21/2002,8164567890,olamide.a@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Full-time,BPbYyzQDo6HdXL8rupoR,SDL3qZCwG3APhPeSG1YY,Enrolled,
LA-2023-0115,Terkura,Suswam,Ortom,LASUCOM/21/028,Male,2/9/1998,9075678901,terkura.s@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,6AAQ6Ml3udCBYuFAdf5d,ysKFrKBqLxvQHxyr2Jb1,Enrolled,
LA-2023-0116,Chukwudi,Eze,Ugochukwu,LASTECH/24/028,Male,4/12/2004,7086789012,chukwudi.e@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Full-time,FSRZ6o3ilrdEyUJDvkMp,SY9eqlwAcYpRJqHplZJC,Enrolled,
LA-2023-0117,Tariq,Suleiman,Aminu,LASCO/22/029,Male,9/25/2001,8097890123,tariq.s@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,OxjSopvz2qXdlsFZgvLL,8GUV35coPpLObsDH7XV8,Enrolled,
LA-2023-0118,Oladapo,Awolowo,Segun,LASU/23/033,Male,5/18/1999,8108901234,oladapo.a@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Sandwich,IBfNa7nUxsRLjrL3L8Cg,S48tsAT6wZFGpnp8BSOx,Enrolled,
LA-2023-0119,Mfon,Inyang,Etim,LASUCOM/21/029,Male,12/7/2002,9019012345,mfon.i@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,xI5e0YceIWH2OWBwNERZ,VoESoPL6RmT0h2SGAyHH,Enrolled,
LA-2023-0120,Nosakhare,Omoregie,Eghosa,LASTECH/24/029,Male,3/31/2003,7020123456,nosakhare.o@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Part-time,FSRZ6o3ilrdEyUJDvkMp,J694B8RpGjCsFWBq546r,Enrolled,
LA-2023-0121,Ikenna,Okeke,Chidi,LASCO/22/030,Male,8/24/2000,8031234567,ikenna.o@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,dGLfl8x8JB39eyWTtzSD,QlA5B9wfpxBVox8Y8xte,Enrolled,
LA-2023-0122,Aliko,Dangote,Sanusi,LASU/23/034,Male,1/16/2001,8142345678,aliko.d@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Epe,Full-time,kv2uxjfEqOeB5Pyw2RFm,7sOYGbPXpzR6BoU2F6Jn,Enrolled,
LA-2023-0123,Ayomide,Adeleke,Tobi,LASUCOM/21/030,Male,10/4/1998,9053456789,ayomide.a@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,xI5e0YceIWH2OWBwNERZ,J7eDgJhrgDRiwEzkRI3x,Enrolled,
LA-2023-0124,Efe,Ibori,Onoriode,LASTECH/24/030,Male,6/28/2004,7064567890,efe.i@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Full-time,rcrzL3nmpb9cGupjjYM8,Xs6Dei4NU2Y77Qig6Ymt,Enrolled,
LA-2023-0125,Ebube,Nwachukwu,Uche,LASCO/22/031,Male,3/9/2002,8075678901,ebube.n@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,IffTxMKa5pP1L8aPov4B,cbqMHNlywpDplArAs1Yu,Enrolled,
LA-2023-0126,Abubakar,Shehu,Kabir,LASU/23/035,Male,7/22/1999,8186789012,abubakar.s@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Full-time,tdhfXwI3QOGiX2vEgBw1,vWe424ObhwZcVN1eMJ9v,Enrolled,
LA-2023-0127,Wike,Amaechi,Chibuike,LASUCOM/21/031,Male,5/11/2001,9097890123,wike.a@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,6AAQ6Ml3udCBYuFAdf5d,CzDBDvR5rTkjLNHkGvMy,Enrolled,
LA-2023-0128,Halima,Abubakar,Aisha,LASTECH/24/031,Female,9/3/2003,7008901234,halima.a@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Full-time,rcrzL3nmpb9cGupjjYM8,4TVYos56o9xLYgz2D2ta,Enrolled,
LA-2023-0129,Chidinma,Okoro,Amarachi,LASCO/22/032,Female,11/26/2000,8019012345,chidinma.o@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,KdmVyifOdg6TBLSQMQE5,B5khS2gyQMuudnV8uLYp,Enrolled,
LA-2023-0130,Dooshima,Akume,Ngodoo,LASU/23/036,Female,4/18/2002,8120123456,dooshima.a@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Part-time,BPbYyzQDo6HdXL8rupoR,3c9TxLTuaCvbo2q05wgM,Enrolled,
LA-2023-0131,Edidiong,Ekpenyong,Imaobong,LASUCOM/21/032,Female,8/1/1999,9031234567,edidiong.e@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,xI5e0YceIWH2OWBwNERZ,dZVN7NyHXprhDN7Uja2n,Enrolled,
LA-2023-0132,Ese,Uduaghan,Tejiri,LASTECH/24/032,Female,12/13/2004,7042345678,ese.u@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Full-time,FSRZ6o3ilrdEyUJDvkMp,SY9eqlwAcYpRJqHplZJC,Enrolled,
LA-2023-0133,Ebi,Sylva,Pere,LASCO/22/033,Female,2/27/2001,8053456789,ebi.s@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,KW7P3IAmuIF8UfA732bn,UsQcLDDsZIOunQFppdNR,Enrolled,
LA-2023-0134,Folashade,Tinubu,Kemi,LASU/23/037,Female,6/10/1998,8164567890,folashade.t@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Full-time,IBfNa7nUxsRLjrL3L8Cg,JX0b6qIu1SP15lzNOMLC,Enrolled,
LA-2023-0135,Osasere,Obaseki,Itohan,LASUCOM/21/033,Female,10/24/2002,9075678901,osasere.o@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,6AAQ6Ml3udCBYuFAdf5d,ysKFrKBqLxvQHxyr2Jb1,Enrolled,
LA-2023-0136,Zainab,Bello,Fatima,LASTECH/24/033,Female,5/6/2003,7086789012,zainab.b@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Part-time,rcrzL3nmpb9cGupjjYM8,Xs6Dei4NU2Y77Qig6Ymt,Enrolled,
LA-2023-0137,Nkiru,Uba,Ogechi,LASCO/22/034,Female,1/19/2000,8097890123,nkiru.u@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,OxjSopvz2qXdlsFZgvLL,8GUV35coPpLObsDH7XV8,Enrolled,
LA-2023-0138,Ekaette,Udom,Ini,LASU/23/038,Female,8/31/2001,8108901234,ekaette.u@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Epe,Full-time,kv2uxjfEqOeB5Pyw2RFm,a5rQHT9XXh8O5CBfXiiN,Enrolled,
LA-2023-0139,Tariere,Dickson,Boma,LASUCOM/21/034,Female,12/14/1999,9019012345,tariere.d@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,xI5e0YceIWH2OWBwNERZ,VoESoPL6RmT0h2SGAyHH,Enrolled,
LA-2023-0140,Yemisi,Osinbajo,Bisi,LASTECH/24/034,Female,3/28/2004,7020123456,yemisi.o@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Full-time,FSRZ6o3ilrdEyUJDvkMp,J694B8RpGjCsFWBq546r,Enrolled,
LA-2023-0141,Onome,Okowa,Ejiro,LASCO/22/035,Female,7/12/2002,8031234567,onome.o@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,dGLfl8x8JB39eyWTtzSD,DWjX6ELYCpUaWHRfhcex,Enrolled,
LA-2023-0142,Hauwa,El-Rufai,Jamila,LASU/23/039,Female,11/5/2000,8142345678,hauwa.e@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Full-time,tdhfXwI3QOGiX2vEgBw1,0mdjsyWCnUUsoUiXax0c,Enrolled,
LA-2023-0143,Amaka,Nnamani,Chioma,LASUCOM/21/035,Female,2/17/2003,9053456789,amaka.n@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,xI5e0YceIWH2OWBwNERZ,J7eDgJhrgDRiwEzkRI3x,Enrolled,
LA-2023-0144,Ngodoo,Ortom,Mnena,LASTECH/24/035,Female,9/22/1998,7064567890,ngodoo.o@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Sandwich,rcrzL3nmpb9cGupjjYM8,4TVYos56o9xLYgz2D2ta,Enrolled,
LA-2023-0145,Mfoniso,Akpabio,Nsikak,LASCO/22/036,Female,5/9/2001,8075678901,mfoniso.a@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,IffTxMKa5pP1L8aPov4B,CSHdyJiNw8pk787kJDnv,Enrolled,
LA-2023-0146,Itohan,Igbinedion,Adesuwa,LASU/23/040,Female,1/30/2004,8186789012,itohan.i@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Full-time,BPbYyzQDo6HdXL8rupoR,SDL3qZCwG3APhPeSG1YY,Enrolled,
LA-2023-0147,Tolulope,Fashola,Ronke,LASUCOM/21/036,Female,6/16/2000,9097890123,tolulope.f@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,6AAQ6Ml3udCBYuFAdf5d,CzDBDvR5rTkjLNHkGvMy,Enrolled,
LA-2023-0148,Safiya,Ganduje,Maryam,LASTECH/24/036,Female,10/4/2002,7008901234,safiya.g@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Full-time,FSRZ6o3ilrdEyUJDvkMp,SY9eqlwAcYpRJqHplZJC,Enrolled,
LA-2023-0149,Ogechi,Kalu,Nkechi,LASCO/22/037,Female,3/25/1999,8019012345,ogechi.k@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Part-time,KdmVyifOdg6TBLSQMQE5,B5khS2gyQMuudnV8uLYp,Enrolled,
LA-2023-0150,Imaobong,Duke,Affiong,LASU/23/041,Female,8/11/2003,8120123456,imaobong.d@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Full-time,IBfNa7nUxsRLjrL3L8Cg,GdbyDv9N7ANTDIfDWmIf,Enrolled,
LA-2023-0151,Boma,Horsfall,Tonye,LASUCOM/21/037,Female,12/29/2001,9031234567,boma.h@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,xI5e0YceIWH2OWBwNERZ,dZVN7NyHXprhDN7Uja2n,Enrolled,
LA-2023-0152,Kemi,Fayemi,Tola,LASTECH/24/037,Female,7/6/1998,7042345678,kemi.f@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Full-time,rcrzL3nmpb9cGupjjYM8,Xs6Dei4NU2Y77Qig6Ymt,Enrolled,
LA-2023-0153,Tejiri,Omo-Agege,Rukevwe,LASCO/22/038,Female,2/21/2004,8053456789,tejiri.o@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,KW7P3IAmuIF8UfA732bn,UsQcLDDsZIOunQFppdNR,Enrolled,
LA-2023-0154,Binta,Matawalle,Hadiza,LASU/23/042,Female,9/8/2000,8164567890,binta.m@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Epe,Full-time,kv2uxjfEqOeB5Pyw2RFm,7sOYGbPXpzR6BoU2F6Jn,Enrolled,
LA-2023-0155,Chioma,Soludo,Ifeoma,LASUCOM/21/038,Female,4/15/2002,9075678901,chioma.s@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,6AAQ6Ml3udCBYuFAdf5d,ysKFrKBqLxvQHxyr2Jb1,Enrolled,
LA-2023-0156,Mnena,Alia,Sewuese,LASTECH/24/038,Female,11/20/2003,7086789012,mnena.a@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Full-time,FSRZ6o3ilrdEyUJDvkMp,J694B8RpGjCsFWBq546r,Enrolled,
LA-2023-0157,Nsikak,Enang,Idongesit,LASCO/22/039,Female,1/5/1999,8097890123,nsikak.e@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,OxjSopvz2qXdlsFZgvLL,8GUV35coPpLObsDH7XV8,Enrolled,
LA-2023-0158,Adesuwa,Oshiomhole,Eki,LASU/23/043,Female,6/23/2001,8108901234,adesuwa.o@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Sandwich,tdhfXwI3QOGiX2vEgBw1,vWe424ObhwZcVN1eMJ9v,Enrolled,
LA-2023-0159,Ronke,Sanwo-Olu,Bola,LASUCOM/21/039,Female,10/10/2004,9019012345,ronke.s@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,xI5e0YceIWH2OWBwNERZ,VoESoPL6RmT0h2SGAyHH,Enrolled,
LA-2023-0160,Maryam,Ribadu,Asmau,LASTECH/24/039,Female,3/17/2000,7020123456,maryam.r@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Full-time,rcrzL3nmpb9cGupjjYM8,4TVYos56o9xLYgz2D2ta,Enrolled,
LA-2023-0161,Nkechi,Ikpeazu,Uchechi,LASCO/22/040,Female,8/5/2002,8031234567,nkechi.i@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,dGLfl8x8JB39eyWTtzSD,hiTs05zK1DXJoEwXOEDH,Enrolled,
LA-2023-0162,Affiong,Imoke,Ekanem,LASU/23/044,Female,12/2/1998,8142345678,affiong.i@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Full-time,BPbYyzQDo6HdXL8rupoR,3c9TxLTuaCvbo2q05wgM,Enrolled,
LA-2023-0163,Tonye,Cole,Ibim,LASUCOM/21/040,Female,7/27/2003,9053456789,tonye.c@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,xI5e0YceIWH2OWBwNERZ,J7eDgJhrgDRiwEzkRI3x,Enrolled,
LA-2023-0164,Tola,Aregbesola,Sola,LASTECH/24/040,Female,2/14/2001,7064567890,tola.a@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Part-time,FSRZ6o3ilrdEyUJDvkMp,SY9eqlwAcYpRJqHplZJC,Enrolled,
LA-2023-0165,Rukevwe,Ibori,Voke,LASCO/22/041,Female,9/9/1999,8075678901,rukevwe.i@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,IffTxMKa5pP1L8aPov4B,cbqMHNlywpDplArAs1Yu,Enrolled,
LA-2023-0166,Hadiza,Rufai,Lami,LASU/23/045,Female,5/18/2004,8186789012,hadiza.r@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Ojo,Full-time,IBfNa7nUxsRLjrL3L8Cg,S48tsAT6wZFGpnp8BSOx,Enrolled,
LA-2023-0167,Ifeoma,Obi,Chika,LASUCOM/21/041,Female,11/22/2000,9097890123,ifeoma.o@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,6AAQ6Ml3udCBYuFAdf5d,CzDBDvR5rTkjLNHkGvMy,Enrolled,
LA-2023-0168,Sewuese,Akume,Hembadoon,LASTECH/24/041,Female,4/7/2002,7008901234,sewuese.a@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Full-time,rcrzL3nmpb9cGupjjYM8,Xs6Dei4NU2Y77Qig6Ymt,Enrolled,
LA-2023-0169,Idongesit,Akpan,Eno,LASCO/22/042,Female,1/31/2003,8019012345,idongesit.a@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,KdmVyifOdg6TBLSQMQE5,B5khS2gyQMuudnV8uLYp,Enrolled,
LA-2023-0170,Eki,Igbinedion,Imuwahen,LASU/23/046,Female,8/16/1998,8120123456,eki.i@student.edu.ng,tiOGCLZ3STaPgDmP9X6a,Epe,Full-time,kv2uxjfEqOeB5Pyw2RFm,zIiiQIeAyMm29LyFDxd2,Enrolled,
LA-2023-0171,Bola,Ambode,Funke,LASUCOM/21/042,Female,10/1/2001,9031234567,bola.a@student.edu.ng,NHlJvMrUGGAeI6Jd5pTg,Ikeja,Full-time,xI5e0YceIWH2OWBwNERZ,dZVN7NyHXprhDN7Uja2n,Enrolled,
LA-2023-0172,Asmau,Zulum,Aisha,LASTECH/24/042,Female,6/25/2004,7042345678,asmau.z@student.edu.ng,mBk6Dx5V03yQrnicjBuk,Main Campus,Full-time,FSRZ6o3ilrdEyUJDvkMp,J694B8RpGjCsFWBq546r,Enrolled,
LA-2023-0173,Uchechi,Uzodinma,Nneka,LASCO/22/043,Female,12/19/2000,8053456789,uchechi.u@student.edu.ng,THVMs2YaG7xV3AILO4Pl,Main Campus,Full-time,KW7P3IAmuIF8UfA732bn,UsQcLDDsZIOunQFppdNR,Enrolled,`;

async function upload() {
  const lines = csvData.trim().split('\n');
  console.log(`Starting upload of ${lines.length} students...`);
  
  let count = 0;
  for (const line of lines) {
    const values = line.split(',');
    if (values.length < 15) continue;

    // Map fields
    const student: any = {
      lasrraId: values[0].trim(),
      firstName: values[1].trim(),
      lastName: values[2].trim(),
      otherName: values[3].trim(),
      matricNumber: values[4].trim(),
      sex: values[5].trim(),
      gender: values[5].trim(), // Keep both for safety
      dob: values[6].trim(),
      dateOfBirth: values[6].trim(), // Keep both for safety
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

    // Fix Phone Number: add 0 prefix if 10 digits
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
