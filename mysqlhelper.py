# -*- coding: utf-8 -*-

import pymysql
from utils import *

class DBConnection:
    def __init__(self, logger, **kwargs):
        self.logger = logger
        self.param_connection = kwargs
        self.open_connection()


    def open_connection(self):
        self.connect = pymysql.connect(**(self.param_connection), autocommit=True)
        self.cursor = self.connect.cursor()


    def is_connection_open(self):
        return self.connect.open


    def close_connection(self):
        if hasattr(self, 'connect') and self.connect:
            self.connect.close()


    def insert(self, table, is_replace = False, timestamp = None, **kwargs):
        query = ''
        
        try:
            placeholders = ', '.join(['%s'] * len(kwargs))
            columns = ', '.join(kwargs.keys())
            query = "INSERT INTO %s (%s) VALUES (%s)" % (table, columns, placeholders)
            if is_replace:
                placeholders_update = ', '.join('`{}`=VALUES(`{}`)'.format(key, key)
                                                 for key in list(kwargs.keys())[1:])
                if timestamp:
                    placeholders_update += ', `' + timestamp + '`=NOW()'
                query += " ON DUPLICATE KEY UPDATE %s" % (placeholders_update)
            self.cursor.execute(query, list(kwargs.values()))
        except pymysql.Error as err:
            self.logger.error('Error %s' % err) if self.logger else eprint('Error', err)

        return query


    def select(self, table, where = None, json = False):
        result = ''

        try:
            query = "SELECT * FROM %s" % (table)
            if where:
                query += " WHERE %s" % (where)
            self.cursor.execute(query)
            result = self.cursor.fetchall()
            if json:
                result = [dict((self.cursor.description[i][0], value) for i, value in enumerate(row)) for row in result]
        except pymysql.Error as err:
            self.logger.error('Error %s' % err) if self.logger else eprint('Error', err)

        return result


    def delete(self, table, where):
        try:
            query = "DELETE FROM %s WHERE %s" % (table, where)
            self.cursor.execute(query)
        except pymysql.Error as err:
            self.logger.error('Error %s' % err) if self.logger else eprint('Error', err)

    
    def __del__(self):
        self.close_connection()
