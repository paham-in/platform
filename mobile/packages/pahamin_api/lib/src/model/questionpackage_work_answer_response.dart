//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'questionpackage_work_answer_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionpackageWorkAnswerResponse {
  /// Returns a new [QuestionpackageWorkAnswerResponse] instance.
  QuestionpackageWorkAnswerResponse({

     this.content,

     this.id,
  });

  @JsonKey(
    
    name: r'content',
    required: false,
    includeIfNull: false,
  )


  final String? content;



  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionpackageWorkAnswerResponse &&
      other.content == content &&
      other.id == id;

    @override
    int get hashCode =>
        content.hashCode +
        id.hashCode;

  factory QuestionpackageWorkAnswerResponse.fromJson(Map<String, dynamic> json) => _$QuestionpackageWorkAnswerResponseFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionpackageWorkAnswerResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

