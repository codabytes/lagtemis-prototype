const csv = `picture,lasrraId,staffId,title,surname,firstName,email,mobilePhone,gender,designation,dob,highestQualification,institutionId,facultyId,departmentId,employmentStatus,gradeLevel,dateOfFirstAppointment,staffType
,LA-10000001,LASCOHET/ST/2015/001,Mr.,ADEBAYO,Oluwaseun,o.adebayo@lascohet.edu.ng,08030000001,Male,Lecturer II,4/12/1985,M.Sc,THVMs2YaG7xV3AILO4Pl,dGLfl8x8JB39eyWTtzSD,DWjX6ELYCpUaWHRfhcex,Active,CONUASS 3,8/1/2015,Academic
,LA-10000002,LASCOHET/ST/2010/002,Dr.,OKAFOR,Chioma,c.okafor@lascohet.edu.ng,08030000002,Female,Senior Lecturer,11/23/1978,PhD,THVMs2YaG7xV3AILO4Pl,dGLfl8x8JB39eyWTtzSD,QlA5B9wfpxBVox8Y8xte,Active,CONUASS 5,2/15/2010,Academic
,LA-10000003,LASCOHET/ST/2018/003,Mrs.,MUSA,Aisha,a.musa@lascohet.edu.ng,08040000003,Female,Assistant Lecturer,1/5/1990,B.Sc,THVMs2YaG7xV3AILO4Pl,dGLfl8x8JB39eyWTtzSD,hiTs05zK1DXJoEwXOEDH,On Study Leave,CONUASS 2,9/10/2018,Academic
,LA-10000004,LASCOHET/ST/2012/004,Mr.,OJO,Tunde,t.ojo@lascohet.edu.ng,08050000004,Male,Lecturer I,7/19/1982,M.Sc,THVMs2YaG7xV3AILO4Pl,IffTxMKa5pP1L8aPov4B,CSHdyJiNw8pk787kJDnv,Active,CONUASS 4,11/1/2012,Academic
,LA-10000005,LASCOHET/ST/2005/005,Prof.,BALOGUN,Ibrahim,i.balogun@lascohet.edu.ng,08060000005,Male,Professor,3/30/1965,PhD,THVMs2YaG7xV3AILO4Pl,IffTxMKa5pP1L8aPov4B,cbqMHNlywpDplArAs1Yu,Active,CONUASS 7,1/20/2005,Academic
,LA-10000006,LASCOHET/ST/2021/006,Ms.,NWOSU,Amaka,a.nwosu@lascohet.edu.ng,08070000006,Female,Graduate Assistant,8/14/1995,B.Sc,THVMs2YaG7xV3AILO4Pl,KdmVyifOdg6TBLSQMQE5,B5khS2gyQMuudnV8uLYp,Active,CONUASS 1,10/5/2021,Academic
,LA-10000007,LASCOHET/ST/2008/007,Dr.,IBE,Emeka,e.ibe@lascohet.edu.ng,08080000007,Male,Senior Lecturer,12/12/1975,PhD,THVMs2YaG7xV3AILO4Pl,KW7P3IAmuIF8UfA732bn,UsQcLDDsZIOunQFppdNR,On Sabbatical,CONUASS 5,4/18/2008,Academic
,LA-10000008,LASCOHET/ST/2016/008,Mr.,CHUKWU,Nnamdi,n.chukwu@lascohet.edu.ng,08090000008,Male,Lecturer II,5/22/1986,M.Sc,THVMs2YaG7xV3AILO4Pl,OxjSopvz2qXdlsFZgvLL,8GUV35coPpLObsDH7XV8,Active,CONUASS 3,7/25/2016,Academic
,LA-10000009,LASCOHET/ST/2011/009,Mrs.,BELLO,Zainab,z.bello@lascohet.edu.ng,08100000009,Female,Lecturer I,2/17/1981,M.Sc,THVMs2YaG7xV3AILO4Pl,dGLfl8x8JB39eyWTtzSD,DWjX6ELYCpUaWHRfhcex,Active,CONUASS 4,9/12/2011,Academic
,LA-10000010,LASCOHET/ST/2019/010,Dr.,DANJUMA,Fatima,f.danjuma@lascohet.edu.ng,08110000010,Female,Lecturer II,6/8/1988,PhD,THVMs2YaG7xV3AILO4Pl,dGLfl8x8JB39eyWTtzSD,QlA5B9wfpxBVox8Y8xte,Active,CONUASS 3,1/15/2019,Academic
,LA-10000011,LASCOHET/ST/2014/011,Mr.,OLOWO,Dayo,d.olowo@lascohet.edu.ng,08120000011,Male,Lecturer II,9/29/1984,M.Sc,THVMs2YaG7xV3AILO4Pl,dGLfl8x8JB39eyWTtzSD,hiTs05zK1DXJoEwXOEDH,Active,CONUASS 3,3/3/2014,Academic
,LA-10000012,LASCOHET/ST/2009/012,Prof.,ADEYEMI,Yomi,y.adeyemi@lascohet.edu.ng,08130000012,Male,Professor,10/10/1968,PhD,THVMs2YaG7xV3AILO4Pl,IffTxMKa5pP1L8aPov4B,CSHdyJiNw8pk787kJDnv,Active,CONUASS 7,8/20/2009,Academic
,LA-10000013,LASCOHET/ST/2020/013,Ms.,YUSUF,Amina,a.yusuf@lascohet.edu.ng,08140000013,Female,Assistant Lecturer,12/4/1992,B.Sc,THVMs2YaG7xV3AILO4Pl,IffTxMKa5pP1L8aPov4B,cbqMHNlywpDplArAs1Yu,Active,CONUASS 2,11/11/2020,Academic
,LA-10000014,LASCOHET/ST/2017/014,Dr.,BAKARE,Tunde,t.bakare@lascohet.edu.ng,08150000014,Male,Lecturer I,1/25/1985,PhD,THVMs2YaG7xV3AILO4Pl,KdmVyifOdg6TBLSQMQE5,B5khS2gyQMuudnV8uLYp,Active,CONUASS 4,6/18/2017,Academic
,LA-10000015,LASCOHET/ST/2006/015,Mrs.,ABUBAKAR,Kemi,k.abubakar@lascohet.edu.ng,08160000015,Female,Senior Lecturer,4/14/1972,PhD,THVMs2YaG7xV3AILO4Pl,KW7P3IAmuIF8UfA732bn,UsQcLDDsZIOunQFppdNR,On Leave of Absence,CONUASS 5,9/9/2006,Academic
,LA-10000016,LASCOHET/ST/2022/016,Mr.,EZE,Chidi,c.eze@lascohet.edu.ng,08170000016,Male,Graduate Assistant,3/17/1996,B.Sc,THVMs2YaG7xV3AILO4Pl,OxjSopvz2qXdlsFZgvLL,8GUV35coPpLObsDH7XV8,Active,CONUASS 1,2/14/2022,Academic
,LA-10000017,LASCOHET/ST/2013/017,Dr.,OKORO,Uche,u.okoro@lascohet.edu.ng,08180000017,Male,Lecturer I,8/8/1980,PhD,THVMs2YaG7xV3AILO4Pl,dGLfl8x8JB39eyWTtzSD,DWjX6ELYCpUaWHRfhcex,Active,CONUASS 4,5/5/2013,Academic
,LA-10000018,LASCOHET/ST/2007/018,Prof.,AKINWUMI,Bola,b.akinwumi@lascohet.edu.ng,08190000018,Female,Professor,11/20/1966,PhD,THVMs2YaG7xV3AILO4Pl,dGLfl8x8JB39eyWTtzSD,QlA5B9wfpxBVox8Y8xte,Active,CONUASS 7,1/10/2007,Academic
,LA-10000019,LASCOHET/ST/2018/019,Mr.,OLAWALE,Nnamdi,n.olawale@lascohet.edu.ng,08020000019,Male,Assistant Lecturer,2/28/1989,M.Sc,THVMs2YaG7xV3AILO4Pl,IffTxMKa5pP1L8aPov4B,CSHdyJiNw8pk787kJDnv,Active,CONUASS 2,12/1/2018,Academic
,LA-10000020,LASCOHET/ST/2015/020,Mrs.,KOLAWOLE,Funke,f.kolawole@lascohet.edu.ng,08031000020,Female,Lecturer II,7/7/1986,M.Sc,THVMs2YaG7xV3AILO4Pl,KdmVyifOdg6TBLSQMQE5,B5khS2gyQMuudnV8uLYp,Active,CONUASS 3,4/14/2015,Academic
,LA-10000021,LASU/ST/2010/021,Engr.,ADEBAYO,Ibrahim,i.adebayo@lasu.edu.ng,08041000021,Male,Senior Lecturer,5/18/1979,PhD,tiOGCLZ3STaPgDmP9X6a,kv2uxjfEqOeB5Pyw2RFm,zIiiQIeAyMm29LyFDxd2,Active,CONUASS 5,9/1/2010,Academic
,LA-10000022,LASU/ST/2014/022,Dr.,OKAFOR,Amaka,a.okafor@lasu.edu.ng,08051000022,Female,Lecturer I,12/10/1983,PhD,tiOGCLZ3STaPgDmP9X6a,kv2uxjfEqOeB5Pyw2RFm,7sOYGbPXpzR6BoU2F6Jn,Active,CONUASS 4,3/15/2014,Academic
,LA-10000023,LASU/ST/2019/023,Mr.,MUSA,Tunde,t.musa@lasu.edu.ng,08061000023,Male,Assistant Lecturer,4/25/1991,M.Sc,tiOGCLZ3STaPgDmP9X6a,kv2uxjfEqOeB5Pyw2RFm,a5rQHT9XXh8O5CBfXiiN,On Study Leave,CONUASS 2,11/5/2019,Academic
,LA-10000024,LASU/ST/2005/024,Prof.,OJO,Oluwaseun,o.ojo@lasu.edu.ng,08071000024,Male,Professor,8/30/1967,PhD,tiOGCLZ3STaPgDmP9X6a,IBfNa7nUxsRLjrL3L8Cg,JX0b6qIu1SP15lzNOMLC,Active,CONUASS 7,2/12/2005,Academic
,LA-10000025,LASU/ST/2016/025,Mrs.,BALOGUN,Zainab,z.balogun@lasu.edu.ng,08081000025,Female,Lecturer II,1/14/1987,M.Sc,tiOGCLZ3STaPgDmP9X6a,IBfNa7nUxsRLjrL3L8Cg,GdbyDv9N7ANTDIfDWmIf,Active,CONUASS 3,8/20/2016,Academic
,LA-10000026,LASU/ST/2012/026,Dr.,NWOSU,Chidi,c.nwosu@lasu.edu.ng,08091000026,Male,Senior Lecturer,6/5/1980,PhD,tiOGCLZ3STaPgDmP9X6a,IBfNa7nUxsRLjrL3L8Cg,S48tsAT6wZFGpnp8BSOx,On Sabbatical,CONUASS 5,10/10/2012,Academic
,LA-10000027,LASU/ST/2020/027,Ms.,IBE,Chioma,c.ibe@lasu.edu.ng,08101000027,Female,Graduate Assistant,9/22/1996,B.Sc,tiOGCLZ3STaPgDmP9X6a,tdhfXwI3QOGiX2vEgBw1,vWe424ObhwZcVN1eMJ9v,Active,CONUASS 1,1/15/2020,Academic
,LA-10000028,LASU/ST/2011/028,Mr.,CHUKWU,Emeka,e.chukwu@lasu.edu.ng,08111000028,Male,Lecturer I,11/18/1982,M.Sc,tiOGCLZ3STaPgDmP9X6a,tdhfXwI3QOGiX2vEgBw1,0mdjsyWCnUUsoUiXax0c,Active,CONUASS 4,5/25/2011,Academic
,LA-10000029,LASU/ST/2017/029,Dr.,BELLO,Fatima,f.bello@lasu.edu.ng,08121000029,Female,Lecturer II,3/3/1988,PhD,tiOGCLZ3STaPgDmP9X6a,BPbYyzQDo6HdXL8rupoR,SDL3qZCwG3APhPeSG1YY,Active,CONUASS 3,9/14/2017,Academic
,LA-10000030,LASU/ST/2008/030,Prof.,DANJUMA,Yomi,y.danjuma@lasu.edu.ng,08131000030,Male,Professor,12/25/1970,PhD,tiOGCLZ3STaPgDmP9X6a,BPbYyzQDo6HdXL8rupoR,3c9TxLTuaCvbo2q05wgM,Active,CONUASS 7,7/7/2008,Academic
,LA-10000031,LASU/ST/2015/031,Mrs.,OLOWO,Kemi,k.olowo@lasu.edu.ng,08141000031,Female,Lecturer II,10/10/1985,M.Sc,tiOGCLZ3STaPgDmP9X6a,kv2uxjfEqOeB5Pyw2RFm,zIiiQIeAyMm29LyFDxd2,Active,CONUASS 3,2/28/2015,Academic
,LA-10000032,LASU/ST/2013/032,Dr.,ADEYEMI,Nnamdi,n.adeyemi@lasu.edu.ng,08151000032,Male,Lecturer I,4/14/1981,PhD,tiOGCLZ3STaPgDmP9X6a,kv2uxjfEqOeB5Pyw2RFm,7sOYGbPXpzR6BoU2F6Jn,Active,CONUASS 4,11/11/2013,Academic
,LA-10000033,LASU/ST/2021/033,Mr.,YUSUF,Uche,u.yusuf@lasu.edu.ng,08161000033,Male,Graduate Assistant,6/6/1997,B.Sc,tiOGCLZ3STaPgDmP9X6a,kv2uxjfEqOeB5Pyw2RFm,a5rQHT9XXh8O5CBfXiiN,Active,CONUASS 1,8/8/2021,Academic
,LA-10000034,LASU/ST/2007/034,Prof.,BAKARE,Bola,b.bakare@lasu.edu.ng,08171000034,Female,Professor,2/20/1969,PhD,tiOGCLZ3STaPgDmP9X6a,IBfNa7nUxsRLjrL3L8Cg,JX0b6qIu1SP15lzNOMLC,Active,CONUASS 7,5/15/2007,Academic
,LA-10000035,LASU/ST/2018/035,Dr.,ABUBAKAR,Dayo,d.abubakar@lasu.edu.ng,08181000035,Male,Lecturer II,7/27/1989,PhD,tiOGCLZ3STaPgDmP9X6a,IBfNa7nUxsRLjrL3L8Cg,GdbyDv9N7ANTDIfDWmIf,Active,CONUASS 3,4/4/2018,Academic
,LA-10000036,LASU/ST/2014/036,Mrs.,EZE,Funke,f.eze@lasu.edu.ng,08191000036,Female,Lecturer I,9/9/1984,M.Sc,tiOGCLZ3STaPgDmP9X6a,IBfNa7nUxsRLjrL3L8Cg,S48tsAT6wZFGpnp8BSOx,Active,CONUASS 4,12/12/2014,Academic
,LA-10000037,LASU/ST/2009/037,Dr.,OKORO,Ibrahim,i.okoro@lasu.edu.ng,08021000037,Male,Senior Lecturer,11/11/1977,PhD,tiOGCLZ3STaPgDmP9X6a,tdhfXwI3QOGiX2vEgBw1,vWe424ObhwZcVN1eMJ9v,On Leave of Absence,CONUASS 5,3/3/2009,Academic
,LA-10000038,LASU/ST/2016/038,Mr.,AKINWUMI,Tunde,t.akinwumi@lasu.edu.ng,08032000038,Male,Lecturer II,1/31/1986,M.Sc,tiOGCLZ3STaPgDmP9X6a,tdhfXwI3QOGiX2vEgBw1,0mdjsyWCnUUsoUiXax0c,Active,CONUASS 3,10/10/2016,Academic
,LA-10000039,LASU/ST/2022/039,Ms.,OLAWALE,Amina,a.olawale@lasu.edu.ng,08042000039,Female,Graduate Assistant,5/5/1998,B.Sc,tiOGCLZ3STaPgDmP9X6a,BPbYyzQDo6HdXL8rupoR,SDL3qZCwG3APhPeSG1YY,Active,CONUASS 1,7/7/2022,Academic
,LA-10000040,LASU/ST/2010/040,Dr.,KOLAWOLE,Emeka,e.kolawole@lasu.edu.ng,08052000040,Male,Senior Lecturer,8/18/1978,PhD,tiOGCLZ3STaPgDmP9X6a,BPbYyzQDo6HdXL8rupoR,3c9TxLTuaCvbo2q05wgM,Active,CONUASS 5,1/21/2010,Academic
,LA-10000041,LASUCOM/ST/2011/041,Dr.,ADEBAYO,Zainab,z.adebayo@lasucom.edu.ng,08062000041,Female,Lecturer I,2/14/1980,PhD,NHlJvMrUGGAeI6Jd5pTg,xI5e0YceIWH2OWBwNERZ,dZVN7NyHXprhDN7Uja2n,Active,CONUASS 4,6/15/2011,Academic
,LA-10000042,LASUCOM/ST/2015/042,Dr.,OKAFOR,Chidi,c.okafor@lasucom.edu.ng,08072000042,Male,Lecturer II,9/21/1985,PhD,NHlJvMrUGGAeI6Jd5pTg,xI5e0YceIWH2OWBwNERZ,VoESoPL6RmT0h2SGAyHH,Active,CONUASS 3,11/11/2015,Academic
,LA-10000043,LASUCOM/ST/2008/043,Prof.,MUSA,Ngozi,n.musa@lasucom.edu.ng,08082000043,Female,Professor,4/5/1970,PhD,NHlJvMrUGGAeI6Jd5pTg,xI5e0YceIWH2OWBwNERZ,J7eDgJhrgDRiwEzkRI3x,Active,CONUASS 7,2/20/2008,Academic
,LA-10000044,LASUCOM/ST/2019/044,Dr.,OJO,Yomi,y.ojo@lasucom.edu.ng,08092000044,Male,Lecturer II,11/30/1989,PhD,NHlJvMrUGGAeI6Jd5pTg,6AAQ6Ml3udCBYuFAdf5d,CzDBDvR5rTkjLNHkGvMy,On Study Leave,CONUASS 3,5/14/2019,Academic
,LA-10000045,LASUCOM/ST/2013/045,Dr.,BALOGUN,Amaka,a.balogun@lasucom.edu.ng,08102000045,Female,Lecturer I,7/7/1982,PhD,NHlJvMrUGGAeI6Jd5pTg,6AAQ6Ml3udCBYuFAdf5d,ysKFrKBqLxvQHxyr2Jb1,Active,CONUASS 4,9/9/2013,Academic
,LA-10000046,LASUCOM/ST/2006/046,Prof.,NWOSU,Ibrahim,i.nwosu@lasucom.edu.ng,08112000046,Male,Professor,12/12/1965,PhD,NHlJvMrUGGAeI6Jd5pTg,xI5e0YceIWH2OWBwNERZ,dZVN7NyHXprhDN7Uja2n,Active,CONUASS 7,3/3/2006,Academic
,LA-10000047,LASUCOM/ST/2017/047,Dr.,IBE,Fatima,f.ibe@lasucom.edu.ng,08122000047,Female,Lecturer II,1/25/1987,PhD,NHlJvMrUGGAeI6Jd5pTg,xI5e0YceIWH2OWBwNERZ,VoESoPL6RmT0h2SGAyHH,Active,CONUASS 3,8/18/2017,Academic
,LA-10000048,LASUCOM/ST/2021/048,Mr.,CHUKWU,Oluwaseun,o.chukwu@lasucom.edu.ng,08132000048,Male,Assistant Lecturer,6/16/1994,M.Sc,NHlJvMrUGGAeI6Jd5pTg,xI5e0YceIWH2OWBwNERZ,J7eDgJhrgDRiwEzkRI3x,Active,CONUASS 2,2/2/2021,Academic
,LA-10000049,LASUCOM/ST/2010/049,Dr.,BELLO,Tunde,t.bello@lasucom.edu.ng,08142000049,Male,Senior Lecturer,3/22/1979,PhD,NHlJvMrUGGAeI6Jd5pTg,6AAQ6Ml3udCBYuFAdf5d,CzDBDvR5rTkjLNHkGvMy,On Sabbatical,CONUASS 5,10/10/2010,Academic
,LA-10000050,LASUCOM/ST/2016/050,Mrs.,DANJUMA,Chioma,c.danjuma@lasucom.edu.ng,08152000050,Female,Lecturer II,8/8/1986,M.Sc,NHlJvMrUGGAeI6Jd5pTg,6AAQ6Ml3udCBYuFAdf5d,ysKFrKBqLxvQHxyr2Jb1,Active,CONUASS 3,12/12/2016,Academic
,LA-10000051,LASUCOM/ST/2014/051,Dr.,OLOWO,Emeka,e.olowo@lasucom.edu.ng,08162000051,Male,Lecturer I,5/5/1983,PhD,NHlJvMrUGGAeI6Jd5pTg,xI5e0YceIWH2OWBwNERZ,dZVN7NyHXprhDN7Uja2n,Active,CONUASS 4,4/14/2014,Academic
,LA-10000052,LASUCOM/ST/2009/052,Prof.,ADEYEMI,Bola,b.adeyemi@lasucom.edu.ng,08172000052,Female,Professor,11/11/1968,PhD,NHlJvMrUGGAeI6Jd5pTg,xI5e0YceIWH2OWBwNERZ,VoESoPL6RmT0h2SGAyHH,Active,CONUASS 7,7/7/2009,Academic
,LA-10000053,LASUCOM/ST/2020/053,Ms.,YUSUF,Amina,a.yusuf@lasucom.edu.ng,08182000053,Female,Graduate Assistant,10/20/1996,B.Sc,NHlJvMrUGGAeI6Jd5pTg,xI5e0YceIWH2OWBwNERZ,J7eDgJhrgDRiwEzkRI3x,Active,CONUASS 1,9/9/2020,Academic
,LA-10000054,LASUCOM/ST/2012/054,Dr.,BAKARE,Dayo,d.bakare@lasucom.edu.ng,08192000054,Male,Senior Lecturer,1/31/1981,PhD,NHlJvMrUGGAeI6Jd5pTg,6AAQ6Ml3udCBYuFAdf5d,CzDBDvR5rTkjLNHkGvMy,Active,CONUASS 5,6/6/2012,Academic
,LA-10000055,LASUCOM/ST/2018/055,Mr.,ABUBAKAR,Nnamdi,n.abubakar@lasucom.edu.ng,08022000055,Male,Assistant Lecturer,12/12/1990,M.Sc,NHlJvMrUGGAeI6Jd5pTg,6AAQ6Ml3udCBYuFAdf5d,ysKFrKBqLxvQHxyr2Jb1,Active,CONUASS 2,3/3/2018,Academic
,LA-10000056,LASUCOM/ST/2007/056,Dr.,EZE,Kemi,k.eze@lasucom.edu.ng,08033000056,Female,Senior Lecturer,2/28/1976,PhD,NHlJvMrUGGAeI6Jd5pTg,xI5e0YceIWH2OWBwNERZ,dZVN7NyHXprhDN7Uja2n,Active,CONUASS 5,11/22/2007,Academic
,LA-10000057,LASUCOM/ST/2015/057,Dr.,OKORO,Uche,u.okoro@lasucom.edu.ng,08043000057,Male,Lecturer II,6/6/1985,PhD,NHlJvMrUGGAeI6Jd5pTg,xI5e0YceIWH2OWBwNERZ,VoESoPL6RmT0h2SGAyHH,Active,CONUASS 3,1/10/2015,Academic
,LA-10000058,LASUCOM/ST/2022/058,Ms.,AKINWUMI,Funke,f.akinwumi@lasucom.edu.ng,08053000058,Female,Graduate Assistant,4/14/1998,B.Sc,NHlJvMrUGGAeI6Jd5pTg,xI5e0YceIWH2OWBwNERZ,J7eDgJhrgDRiwEzkRI3x,Active,CONUASS 1,10/10/2022,Academic
,LA-10000059,LASUCOM/ST/2013/059,Dr.,OLAWALE,Ibrahim,i.olawale@lasucom.edu.ng,08063000059,Male,Lecturer I,9/9/1982,PhD,NHlJvMrUGGAeI6Jd5pTg,6AAQ6Ml3udCBYuFAdf5d,CzDBDvR5rTkjLNHkGvMy,Active,CONUASS 4,8/8/2013,Academic
,LA-10000060,LASUCOM/ST/2010/060,Dr.,KOLAWOLE,Zainab,z.kolawole@lasucom.edu.ng,08073000060,Female,Senior Lecturer,11/11/1979,PhD,NHlJvMrUGGAeI6Jd5pTg,6AAQ6Ml3udCBYuFAdf5d,ysKFrKBqLxvQHxyr2Jb1,On Leave of Absence,CONUASS 5,5/5/2010,Academic
,LA-10000061,LASUSTECH/ST/2016/061,Engr.,ADEBAYO,Chidi,c.adebayo@lasustech.edu.ng,08083000061,Male,Lecturer II,3/15/1986,M.Sc,mBk6Dx5V03yQrnicjBuk,FSRZ6o3ilrdEyUJDvkMp,SY9eqlwAcYpRJqHplZJC,Active,CONUASS 3,9/1/2016,Academic
,LA-10000062,LASUSTECH/ST/2012/062,Dr.,OKAFOR,Fatima,f.okafor@lasustech.edu.ng,08093000062,Female,Senior Lecturer,8/20/1981,PhD,mBk6Dx5V03yQrnicjBuk,FSRZ6o3ilrdEyUJDvkMp,J694B8RpGjCsFWBq546r,Active,CONUASS 5,2/14/2012,Academic
,LA-10000063,LASUSTECH/ST/2020/063,Mr.,MUSA,Emeka,e.musa@lasustech.edu.ng,08103000063,Male,Assistant Lecturer,11/10/1993,M.Sc,mBk6Dx5V03yQrnicjBuk,rcrzL3nmpb9cGupjjYM8,Xs6Dei4NU2Y77Qig6Ymt,Active,CONUASS 2,7/7/2020,Academic
,LA-10000064,LASUSTECH/ST/2009/064,Prof.,OJO,Ngozi,n.ojo@lasustech.edu.ng,08113000064,Female,Professor,5/5/1969,PhD,mBk6Dx5V03yQrnicjBuk,rcrzL3nmpb9cGupjjYM8,4TVYos56o9xLYgz2D2ta,Active,CONUASS 7,10/10/2009,Academic
,LA-10000065,LASUSTECH/ST/2018/065,Engr.,BALOGUN,Yomi,y.balogun@lasustech.edu.ng,08123000065,Male,Lecturer II,2/28/1988,M.Sc,mBk6Dx5V03yQrnicjBuk,FSRZ6o3ilrdEyUJDvkMp,SY9eqlwAcYpRJqHplZJC,Active,CONUASS 3,12/12/2018,Academic
,LA-10000066,LASUSTECH/ST/2014/066,Mrs.,NWOSU,Amaka,a.nwosu@lasustech.edu.ng,08133000066,Female,Lecturer I,7/7/1984,M.Sc,mBk6Dx5V03yQrnicjBuk,FSRZ6o3ilrdEyUJDvkMp,J694B8RpGjCsFWBq546r,Active,CONUASS 4,4/4/2014,Academic
,LA-10000067,LASUSTECH/ST/2006/067,Dr.,IBE,Ibrahim,i.ibe@lasustech.edu.ng,08143000067,Male,Senior Lecturer,10/10/1975,PhD,mBk6Dx5V03yQrnicjBuk,rcrzL3nmpb9cGupjjYM8,Xs6Dei4NU2Y77Qig6Ymt,On Sabbatical,CONUASS 5,1/20/2006,Academic
,LA-10000068,LASUSTECH/ST/2021/068,Ms.,CHUKWU,Zainab,z.chukwu@lasustech.edu.ng,08153000068,Female,Graduate Assistant,12/12/1997,B.Sc,mBk6Dx5V03yQrnicjBuk,rcrzL3nmpb9cGupjjYM8,4TVYos56o9xLYgz2D2ta,Active,CONUASS 1,6/6/2021,Academic
,LA-10000069,LASUSTECH/ST/2015/069,Engr.,BELLO,Tunde,t.bello@lasustech.edu.ng,08163000069,Male,Lecturer II,4/4/1985,M.Sc,mBk6Dx5V03yQrnicjBuk,FSRZ6o3ilrdEyUJDvkMp,SY9eqlwAcYpRJqHplZJC,Active,CONUASS 3,11/11/2015,Academic
,LA-10000070,LASUSTECH/ST/2011/070,Dr.,DANJUMA,Chioma,c.danjuma@lasustech.edu.ng,08173000070,Female,Lecturer I,9/9/1981,PhD,mBk6Dx5V03yQrnicjBuk,FSRZ6o3ilrdEyUJDvkMp,J694B8RpGjCsFWBq546r,Active,CONUASS 4,3/3/2011,Academic
,LA-10000071,LASUSTECH/ST/2019/071,Mr.,OLOWO,Emeka,e.olowo@lasustech.edu.ng,08183000071,Male,Assistant Lecturer,1/1/1990,M.Sc,mBk6Dx5V03yQrnicjBuk,rcrzL3nmpb9cGupjjYM8,Xs6Dei4NU2Y77Qig6Ymt,On Study Leave,CONUASS 2,8/8/2019,Academic
,LA-10000072,LASUSTECH/ST/2008/072,Prof.,ADEYEMI,Bola,b.adeyemi@lasustech.edu.ng,08193000072,Female,Professor,6/6/1968,PhD,mBk6Dx5V03yQrnicjBuk,rcrzL3nmpb9cGupjjYM8,4TVYos56o9xLYgz2D2ta,Active,CONUASS 7,5/5/2008,Academic
,LA-10000073,LASUSTECH/ST/2017/073,Engr.,YUSUF,Oluwaseun,o.yusuf@lasustech.edu.ng,08023000073,Male,Lecturer II,11/11/1987,M.Sc,mBk6Dx5V03yQrnicjBuk,FSRZ6o3ilrdEyUJDvkMp,SY9eqlwAcYpRJqHplZJC,Active,CONUASS 3,2/2/2017,Academic
,LA-10000074,LASUSTECH/ST/2013/074,Mrs.,BAKARE,Amina,a.bakare@lasustech.edu.ng,08034000074,Female,Lecturer I,2/2/1983,M.Sc,mBk6Dx5V03yQrnicjBuk,FSRZ6o3ilrdEyUJDvkMp,J694B8RpGjCsFWBq546r,Active,CONUASS 4,7/7/2013,Academic
,LA-10000075,LASUSTECH/ST/2005/075,Dr.,ABUBAKAR,Dayo,d.abubakar@lasustech.edu.ng,08044000075,Male,Senior Lecturer,12/12/1973,PhD,mBk6Dx5V03yQrnicjBuk,rcrzL3nmpb9cGupjjYM8,Xs6Dei4NU2Y77Qig6Ymt,Active,CONUASS 5,9/9/2005,Academic
,LA-10000076,LASUSTECH/ST/2022/076,Ms.,EZE,Funke,f.eze@lasustech.edu.ng,08054000076,Female,Graduate Assistant,8/8/1998,B.Sc,mBk6Dx5V03yQrnicjBuk,rcrzL3nmpb9cGupjjYM8,4TVYos56o9xLYgz2D2ta,Active,CONUASS 1,1/1/2022,Academic
,LA-10000077,LASUSTECH/ST/2016/077,Engr.,OKORO,Nnamdi,n.okoro@lasustech.edu.ng,08064000077,Male,Lecturer II,5/5/1986,M.Sc,mBk6Dx5V03yQrnicjBuk,FSRZ6o3ilrdEyUJDvkMp,SY9eqlwAcYpRJqHplZJC,Active,CONUASS 3,10/10/2016,Academic
,LA-10000078,LASUSTECH/ST/2010/078,Dr.,AKINWUMI,Kemi,k.akinwumi@lasustech.edu.ng,08074000078,Female,Senior Lecturer,10/10/1979,PhD,mBk6Dx5V03yQrnicjBuk,FSRZ6o3ilrdEyUJDvkMp,J694B8RpGjCsFWBq546r,On Leave of Absence,CONUASS 5,4/4/2010,Academic
,LA-10000079,LASUSTECH/ST/2018/079,Mr.,OLAWALE,Uche,u.olawale@lasustech.edu.ng,08084000079,Male,Assistant Lecturer,3/3/1989,M.Sc,mBk6Dx5V03yQrnicjBuk,rcrzL3nmpb9cGupjjYM8,Xs6Dei4NU2Y77Qig6Ymt,Active,CONUASS 2,11/11/2018,Academic
,LA-10000080,LASUSTECH/ST/2014/080,Dr.,KOLAWOLE,Ibrahim,i.kolawole@lasustech.edu.ng,08094000080,Male,Lecturer I,6/6/1984,PhD,mBk6Dx5V03yQrnicjBuk,rcrzL3nmpb9cGupjjYM8,4TVYos56o9xLYgz2D2ta,Active,CONUASS 4,12/12/2014,Academic
,LA-10000081,LASCON/ST/2015/081,Mrs.,ADEBAYO,Zainab,z.adebayo@lascon.edu.ng,08104000081,Female,Lecturer II,1/15/1985,M.Sc,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Active,CONUASS 3,6/20/2015,Academic
,LA-10000082,LASCON/ST/2011/082,Dr.,OKAFOR,Chidi,c.okafor@lascon.edu.ng,08114000082,Male,Senior Lecturer,8/25/1980,PhD,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,Active,CONUASS 5,3/10/2011,Academic
,LA-10000083,LASCON/ST/2019/083,Ms.,MUSA,Fatima,f.musa@lascon.edu.ng,08124000083,Female,Assistant Lecturer,12/5/1991,B.Sc,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,TinYumBMKgdjdSsGm593,Active,CONUASS 2,10/15/2019,Academic
,LA-10000084,LASCON/ST/2007/084,Prof.,OJO,Emeka,e.ojo@lascon.edu.ng,08134000084,Male,Professor,4/12/1967,PhD,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Active,CONUASS 7,9/5/2007,Academic
,LA-10000085,LASCON/ST/2016/085,Mrs.,BALOGUN,Amaka,a.balogun@lascon.edu.ng,08144000085,Female,Lecturer II,11/20/1986,M.Sc,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,Active,CONUASS 3,2/28/2016,Academic
,LA-10000086,LASCON/ST/2012/086,Dr.,NWOSU,Yomi,y.nwosu@lascon.edu.ng,08154000086,Male,Lecturer I,5/18/1981,PhD,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,TinYumBMKgdjdSsGm593,Active,CONUASS 4,11/11/2012,Academic
,LA-10000087,LASCON/ST/2021/087,Ms.,IBE,Chioma,c.ibe@lascon.edu.ng,08164000087,Female,Graduate Assistant,2/14/1996,B.Sc,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Active,CONUASS 1,7/7/2021,Academic
,LA-10000088,LASCON/ST/2009/088,Dr.,CHUKWU,Ibrahim,i.chukwu@lascon.edu.ng,08174000088,Male,Senior Lecturer,9/9/1978,PhD,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,On Sabbatical,CONUASS 5,4/4/2009,Academic
,LA-10000089,LASCON/ST/2017/089,Mrs.,BELLO,Ngozi,n.bello@lascon.edu.ng,08184000089,Female,Lecturer II,6/6/1987,M.Sc,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,TinYumBMKgdjdSsGm593,Active,CONUASS 3,12/12/2017,Academic
,LA-10000100,LASCON/ST/2013/100,Dr.,KOLAWOLE,Amaka,a.kolawole@lascon.edu.ng,08115000100,Female,Lecturer I,8/8/1982,PhD,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,Active,CONUASS 4,1/1/2013,Academic
,LA-10000090,LASCON/ST/2013/090,Mr.,DANJUMA,Tunde,t.danjuma@lascon.edu.ng,08194000090,Male,Lecturer I,12/12/1982,M.Sc,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Active,CONUASS 4,5/5/2013,Academic
,LA-10000091,LASCON/ST/2020/091,Ms.,OLOWO,Amina,a.olowo@lascon.edu.ng,08024000091,Female,Assistant Lecturer,3/3/1994,B.Sc,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,Active,CONUASS 2,8/8/2020,Academic
,LA-10000092,LASCON/ST/2006/092,Prof.,ADEYEMI,Bola,b.adeyemi@lascon.edu.ng,08035000092,Female,Professor,10/10/1965,PhD,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,TinYumBMKgdjdSsGm593,Active,CONUASS 7,1/1/2006,Academic
,LA-10000093,LASCON/ST/2018/093,Mrs.,YUSUF,Kemi,k.yusuf@lascon.edu.ng,08045000093,Female,Lecturer II,7/7/1988,M.Sc,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Active,CONUASS 3,2/2/2018,Academic
,LA-10000094,LASCON/ST/2014/094,Dr.,BAKARE,Dayo,d.bakare@lascon.edu.ng,08055000094,Male,Lecturer I,11/11/1983,PhD,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,Active,CONUASS 4,6/6/2014,Academic
,LA-10000095,LASCON/ST/2008/095,Dr.,ABUBAKAR,Uche,u.abubakar@lascon.edu.ng,08065000095,Male,Senior Lecturer,4/4/1977,PhD,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,TinYumBMKgdjdSsGm593,Active,CONUASS 5,10/10/2008,Academic
,LA-10000096,LASCON/ST/2022/096,Ms.,EZE,Funke,f.eze@lascon.edu.ng,08075000096,Female,Graduate Assistant,9/9/1998,B.Sc,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Active,CONUASS 1,3/3/2022,Academic
,LA-10000097,LASCON/ST/2015/097,Mrs.,OKORO,Zainab,z.okoro@lascon.edu.ng,08085000097,Female,Lecturer II,5/5/1985,M.Sc,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,mr4lfeBozpTv9TLByuvN,On Study Leave,CONUASS 3,11/11/2015,Academic
,LA-10000098,LASCON/ST/2010/098,Dr.,AKINWUMI,Nnamdi,n.akinwumi@lascon.edu.ng,08095000098,Male,Senior Lecturer,12/12/1979,PhD,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,TinYumBMKgdjdSsGm593,Active,CONUASS 5,6/6/2010,Academic
,LA-10000099,LASCON/ST/2019/099,Mr.,OLAWALE,Ibrahim,i.olawale@lascon.edu.ng,08105000099,Male,Assistant Lecturer,2/2/1990,M.Sc,tACt0ODnc5T1edIZt17L,iN0J9OpnKABEflgJ5axS,0cZhz8uCTrEBzaRDcfbB,Active,CONUASS 2,9/9/2019,Academic`;

const lines = csv.trim().split('\n');
const headers = lines[0].split(',');
const data = lines.slice(1).map(line => {
  const values = line.split(',');
  const obj = {};
  headers.forEach((header, i) => {
    if (header !== 'picture') {
      obj[header] = values[i];
    }
  });
  return obj;
});

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'src', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(path.join(dataDir, 'staff_data.json'), JSON.stringify(data, null, 2));
console.log('JSON data written to src/data/staff_data.json');
