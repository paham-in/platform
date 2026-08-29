//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'questionpackage_collection_create_input.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionpackageCollectionCreateInput {
  /// Returns a new [QuestionpackageCollectionCreateInput] instance.
  QuestionpackageCollectionCreateInput({

     this.classId,

     this.description,

     this.isFree,

     this.name,
  });

  @JsonKey(
    
    name: r'class_id',
    required: false,
    includeIfNull: false,
  )


  final int? classId;



  @JsonKey(
    
    name: r'description',
    required: false,
    includeIfNull: false,
  )


  final String? description;



  @JsonKey(
    
    name: r'is_free',
    required: false,
    includeIfNull: false,
  )


  final bool? isFree;



  @JsonKey(
    
    name: r'name',
    required: false,
    includeIfNull: false,
  )


  final String? name;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionpackageCollectionCreateInput &&
      other.classId == classId &&
      other.description == description &&
      other.isFree == isFree &&
      other.name == name;

    @override
    int get hashCode =>
        classId.hashCode +
        description.hashCode +
        isFree.hashCode +
        name.hashCode;

  factory QuestionpackageCollectionCreateInput.fromJson(Map<String, dynamic> json) => _$QuestionpackageCollectionCreateInputFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionpackageCollectionCreateInputToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

