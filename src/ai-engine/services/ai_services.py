from fastapi import FastAPI
from dotenv import load_dotenv

from google import genai

import os


load_dotenv()

app = FastAPI()


client = genai.Client(

    api_key=os.getenv(

        "GEMINI_API_KEY"

    )

)


@app.post("/generate-seating")

def generate_seating(data: dict):

    prompt = f"""

Generate seating arrangement.

Event Details:

{data}

"""


    response = client.models.generate_content(

        model=data["modelName"],

        contents=prompt

    )


    return {

        "result":

        response.text

    }



@app.post("/generate-running-order")

def generate_running_order(data: dict):


    prompt = f"""

Generate running order.

Event Details:

{data}

"""


    response = client.models.generate_content(

        model=data["modelName"],

        contents=prompt

    )


    return {

        "result":

        response.text

    }



@app.post("/suggest-traffic-flow")

def suggest_traffic_flow(data: dict):


    prompt = f"""

Suggest traffic flow.

Event Details:

{data}

"""


    response = client.models.generate_content(

        model=data["modelName"],

        contents=prompt

    )


    return {

        "result":

        response.text

    }