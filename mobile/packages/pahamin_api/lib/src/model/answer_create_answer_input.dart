//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'answer_create_answer_input.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class AnswerCreateAnswerInput {
  /// Returns a new [AnswerCreateAnswerInput] instance.
  AnswerCreateAnswerInput({

     this.content,

     this.videoUrl,
  });

  @JsonKey(
    
    name: r'content',
    required: false,
    includeIfNull: false,
  )


  final String? content;



  @JsonKey(
    
    name: r'video_url',
    required: false,
    includeIfNull: false,
  )


  final String? videoUrl;





    @override
    bool operator ==(Object other) => identical(this, other) || other is AnswerCreateAnswerInput &&
      other.content == content &&
      other.videoUrl == videoUrl;

    @override
    int get hashCode =>
        content.hashCode +
        videoUrl.hashCode;

  factory AnswerCreateAnswerInput.fromJson(Map<String, dynamic> json) => _$AnswerCreateAnswerInputFromJson(json);

  Map<String, dynamic> toJson() => _$AnswerCreateAnswerInputToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

