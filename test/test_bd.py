# -*- coding: utf-8 -*-

# from mysqlhelper import DBConnection

# link_bd = DBConnection(None, user="dacrover_user",
# 									password="dacrover_pass",
# 									host="itsuki.e",
# 									port=3306,
# 									database= "dacrover")

import pymysql

connect = pymysql.connect(None, user="dacrover_user",
									password="dacrover_pass",
									host="localhost",
									port=3306,
									database="dacrover")