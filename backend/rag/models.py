from django.db import models
from pydantic import BaseModel, Field, computed_field

# Credibility sub scores
class CredibilitySubs(BaseModel):
    author_score: int = Field(ge = 0, le = 10)
    publisher_score: int = Field(ge = 0, le = 10)
    citation_score: int = Field(ge = 0, le = 5)

    @computed_field
    def total (self) -> int:
        return self.author_score + self.publisher_score + self.citation_score

# Evidence sub scores
class EvidenceSubs(BaseModel):
    supported_score: int = Field(ge = 0, le = 10)
    cross_score: int = Field(ge = 0, le = 5)
    factual_score: int = Field(ge = 0, le = 10)

    @computed_field
    def total (self) -> int:
        return self.supported_score + self.cross_score + self.factual_score
    
# Objectivity sub scores
class ObjectivitySubs(BaseModel):
    perspectives_score: int = Field(ge = 0, le = 5)
    language_use_score: int = Field(ge = 0, le = 7)
    monetary_gain_score: int = Field(ge = 0, le = 8)

    @computed_field
    def total (self) -> int:
        return self.perspectives_score + self.language_use_score + self.monetary_gain_score

# Relevance Sub Scores
class RelevanceSubs(BaseModel):
    timeliness_score: int = Field(ge = 0, le = 7)
    helpfulness_score: int = Field(ge = 0, le = 8)

    @computed_field
    def total (self) -> int:
        return self.timeliness_score + self.helpfulness_score
    
# Scores for rating a source
class Rating_Source(BaseModel):
    credibility_score: CredibilitySubs
    evidence_score: EvidenceSubs
    objectivity_score: ObjectivitySubs
    relevance_score: RelevanceSubs
    purpose_score: int = Field(ge = 0, le = 15)

    @computed_field
    def total (self) -> int:
        return self.credibility_score.total + self.evidence_score.total + self.objectivity_score.total + self.relevance_score.total + self.purpose_score



# Info pulled from source
class Other_Source_Information(BaseModel):
    red_flags: list[str]
    claims: list[str]
    corporations: list[str]


# Subtopic is one if the paths regarding the topic given by the AI
class Subtopic (BaseModel):
    subtopic: str
    description: str


# Subtopic_List is the list of subtopics given by the AI
class Subtopic_List(BaseModel):
    subtopics: list[Subtopic]