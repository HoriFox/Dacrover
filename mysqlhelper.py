import pymysql

class DBConnection:
    def __init__(self, **kwargs):
        self.connect = pymysql.connect(**kwargs)

    def __del__(self):
        if hasattr(self, 'connect') and self.connect:
            # NOTE (m.kucherenko): if connection failed - object is not set
            self.connect.close()

    def insert(self, table, is_replace = False, timestamp = None, **kwargs):
        query = ''
        
        try:
            cursor = self.connect.cursor()
            placeholders = ', '.join(['%s'] * len(kwargs))
            columns = ', '.join(kwargs.keys())
            query = "INSERT INTO %s (%s) VALUES (%s)" % (table, columns, placeholders)
            if is_replace:
                placeholders_update = ', '.join('`{}`=VALUES(`{}`)'.format(key, key)
                                                 for key in list(kwargs.keys())[1:])
                if timestamp:
                    placeholders_update += ', `' + timestamp + '`=NOW()'
                query += " ON DUPLICATE KEY UPDATE %s" % (placeholders_update)
            cursor.execute(query, list(kwargs.values()))
        except pymysql.Error as err:
            print('Error', err)
        else:
            self.connect.commit()

        return query

    def select(self, table, where = None, json = False):
        result = ''

        try:
            cursor = self.connect.cursor()
            query = "SELECT * FROM %s" % (table)
            if where:
                query += " WHERE %s" % (where)
            cursor.execute(query)
            result = cursor.fetchall()
            if json:
                result = [dict((cursor.description[i][0], value) for i, value in enumerate(row)) for row in result]
        except pymysql.Error as err:
            print('Error', err)

        return result

    def delete(self, table, where):
        try:
            cursor = self.connect.cursor()
            query = "DELETE FROM %s WHERE %s" % (table, where)
            cursor.execute(query)
        except pymysql.Error as err:
            print('Error', err)
        else:
            self.connect.commit()
