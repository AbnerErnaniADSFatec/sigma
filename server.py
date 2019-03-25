import json 
import datetime
import pandas as pd
import requests
from conection_pg import Connection_pg
from flask import Flask, request
from flask_cors import CORS, cross_origin
from flask_restful import Resource, Api
from flask_jsonpify import *
from flask.json import JSONEncoder
from datetime import date
from bs4 import BeautifulSoup

class CustomJSONEncoder(JSONEncoder):
    def default(self, obj):
        try:
            if isinstance(obj, date):
                return obj.isoformat()
            iterable = iter(obj)
        except TypeError:
            pass
        else:
            return list(iterable)
        return JSONEncoder.default(self, obj)

app = Flask(__name__)
app.json_encoder = CustomJSONEncoder
api = Api(app)
CORS(app)

@app.route("/")
def hello():
    return jsonify({'text':'Hello World!!!'})

class PCD(Resource):
    def get(self):
        conectar = Connection_pg()
        data = conectar.load_data("public","dcp_series_22")
        return data.to_json()

class PCD_name(Resource):
    def get(self, id):
        conectar = Connection_pg()
        data = conectar.load_data("public","dcp_series_22")
        pcd = { "alias" : "não existe" }
        for i  in range(len(data["id"])):
            if str(id) == str(data["id"][i]):
                pcd = {
                    "id" : str(data["id"][i]),
                    "geom" : data["geom"][i],
                    "alias" : data["alias"][i],
                    "table_name" : data["table_name"][i]
                }
                break
        return jsonify(pcd)

class PCD_history(Resource):
    def get(self, id):
        conectar = Connection_pg()
        data = conectar.load_data("public","dcp_series_22")
        pcd_name = ""
        for i  in range(len(data["id"])):
            if str(id) == str(data["id"][i]):
                pcd_name = data["table_name"][i]
        if pcd_name:
            history = conectar.load_data("public", pcd_name)
            return history.to_json()
        else:
            history = { "datetime" : "não existe" }
            return jsonify(history)

class PCD_history_loko(Resource):
    def get(self, id, code):
        conectar = Connection_pg()
        data = conectar.load_data("public","dcp_series_22")
        print("\n\n\n" + code + "\n\n\n")
        soupHtml = self.get_urlsoup("http://localhost:8080/geoserver/wms?" + code)
        listaObj = self.finding(soupHtml, "pre")
        print(soupHtml)
        pcd_name = ""
        for i  in range(len(data["id"])):
            if str(id) == str(data["id"][i]):
                pcd_name = data["table_name"][i]
        if pcd_name:
            history = conectar.load_data("public", pcd_name)
            return history.to_json()
        else:
            history = { "datetime" : "não existe" }
            return jsonify(history)
    def get_urlsoup(self,a):
        page = requests.get(a)
        soup = BeautifulSoup(page.content, 'html.parser')
        return soup
    def finding(self,b,a):
        x = b.find(a)
        return x
        
api.add_resource(PCD, '/pcd')
api.add_resource(PCD_name, '/pcd/<id>')
api.add_resource(PCD_history, '/pcd/<id>/history')
api.add_resource(PCD_history_loko, '/pcd/<id>/<code>')

if __name__ == '__main__':
    app.run( port = 1524 )
